import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, vi } from "vitest";

vi.mock("obsidian", () => ({
  normalizePath: (path: string) => path.replace(/\\/g, "/").replace(/\/+/g, "/"),
  ItemView: class ItemView {},
  Modal: class Modal {},
  Notice: class Notice { constructor(_message: string) {} },
  Plugin: class Plugin {},
  PluginSettingTab: class PluginSettingTab {},
  Setting: class Setting {},
  TFile: class TFile {},
  WorkspaceLeaf: class WorkspaceLeaf {},
  requestUrl: vi.fn()
}));

import { DEFAULT_SETTINGS } from "../src/core/settings";
import { VaultConnector } from "../src/models/VaultConnector";
import { ConversationVaultConnector, DocumentVaultConnector, excerptFromMarkdown, inferConversationPlatform, isMoc } from "../src/providers/VaultConnectorProviders";
import { CollectionService } from "../src/services/CollectionService";
import { UnifiedIndexService, UnifiedSearchService, dedupeEntries } from "../src/services/UnifiedIndexService";
import { PluginStateManager } from "../src/services/PluginStorage/StateManager";
import { IndexRepository } from "../src/services/PluginStorage/IndexRepository";
import { VaultAvailabilityService, VaultConnectorService } from "../src/services/VaultConnectorService";

function connector(overrides: Partial<VaultConnector> = {}): VaultConnector {
  return {
    id: "conversation-fixture",
    displayName: "Conversation Fixture",
    role: "conversations",
    windowsPath: "C:/missing",
    linuxPath: "",
    vaultName: "ConversationVault",
    enabled: true,
    includePatterns: ["**/*.md"],
    excludePatterns: [],
    preferredNoteType: "conversation",
    icon: "messages-square",
    colorToken: "var(--text-muted)",
    defaultCollections: ["Conversation Archive"],
    enableDefaultCollections: false,
    lastScanAt: null,
    lastError: null,
    ...overrides
  };
}

function tempVault(): string {
  return mkdtempSync(join(tmpdir(), "kl-multivault-"));
}

describe("Vault connector path safety", () => {
  it("normalizes Windows and Linux paths", () => {
    const service = new VaultConnectorService();
    expect(service.normalizePath("D:\\Dropbox\\Obsidian_Vault\\")).toBe("D:/Dropbox/Obsidian_Vault");
    expect(service.normalizePath("/home/user//vault/")).toBe("/home/user/vault");
  });

  it("reports unavailable connectors without assuming paths exist", () => {
    const status = new VaultAvailabilityService().check(connector({ windowsPath: "Z:/definitely-missing-kl-vault" }));
    expect(status.available).toBe(false);
    expect(status.error).toMatch(/missing|offline|inaccessible/i);
  });

  it("applies connector-specific exclusions and built-in hidden exclusions", () => {
    const service = new VaultConnectorService();
    const cfg = connector({ excludePatterns: ["Archive/**"] });
    expect(service.shouldScanPath("ChatGPT/session.md", cfg)).toBe(true);
    expect(service.shouldScanPath("Archive/session.md", cfg)).toBe(false);
    expect(service.shouldScanPath(".obsidian/workspace.json", cfg)).toBe(false);
    expect(service.shouldScanPath("node_modules/pkg/readme.md", cfg)).toBe(false);
  });

  it("generates encoded Obsidian open URIs", () => {
    expect(new VaultConnectorService().obsidianOpenUri("My Vault", "Folder/A note.md")).toBe("obsidian://open?vault=My%20Vault&file=Folder%2FA%20note.md");
  });
});

describe("Conversation connector behavior", () => {
  it("infers ChatGPT Claude and Gemini platforms from folders with frontmatter override", () => {
    expect(inferConversationPlatform("ChatGPT/thread.md")).toBe("ChatGPT");
    expect(inferConversationPlatform("Claude/thread.md")).toBe("Claude");
    expect(inferConversationPlatform("Gemini/thread.md")).toBe("Gemini");
    expect(inferConversationPlatform("ChatGPT/thread.md", { platform: "CustomAI" })).toBe("CustomAI");
  });

  it("detects MOC files and creates short excerpts without code blocks", () => {
    expect(isMoc("Maps/MOC - AI.md", "# AI")).toBe(true);
    expect(excerptFromMarkdown("# Titulo\nTexto em portugues and English.\n```ts\nsecretCode();\n```\nMore text")).not.toContain("secretCode");
  });

  it("indexes markdown chats with headings tags platform and excerpt", () => {
    const root = tempVault();
    try {
      mkdirSync(join(root, "ChatGPT"));
      writeFileSync(join(root, "ChatGPT", "thread.md"), "---\ntags: ia, chat\n---\n# Conversa\nTexto em portugues and English.");
      const refs = new ConversationVaultConnector().scan(connector({ windowsPath: root }), root);
      expect(refs[0].source_platform).toBe("ChatGPT");
      expect(refs[0].tags).toEqual(["ai", "chat"]);
      expect(refs[0].metadata.headings).toEqual(["Conversa"]);
      expect(refs[0].excerpt).toContain("Texto em portugues");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("Document connector behavior", () => {
  it("indexes markdown catalog notes and file references without full extraction", () => {
    const root = tempVault();
    try {
      writeFileSync(join(root, "catalog.md"), "---\ntitle: Catalog\n---\n# Docs\nShort catalog note");
      writeFileSync(join(root, "paper.pdf"), "fake pdf bytes");
      const refs = new DocumentVaultConnector().scan(connector({ role: "documents", includePatterns: ["**/*.md", "**/*.pdf"], windowsPath: root }), root);
      expect(refs.map((ref) => ref.note_title).sort()).toEqual(["Catalog", "paper"]);
      expect(refs.find((ref) => ref.external_path === "paper.pdf")?.excerpt).toBe("");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("does not use external write APIs in connector providers", () => {
    const source = readFileSync(join(process.cwd(), "src/providers/VaultConnectorProviders.ts"), "utf8");
    expect(source).not.toMatch(/writeFile|unlink|rename|mkdir|rmSync/);
  });
});

describe("Unified index and search", () => {
  it("prevents duplicate entries", () => {
    const entry = {
      id: "a",
      origin: "external" as const,
      connector_id: "c",
      connector_name: "C",
      vault_name: "V",
      role: "documents" as const,
      type: "document",
      title: "Doc",
      creator: null,
      path: "doc.md",
      url: null,
      open_uri: "uri",
      tags: [],
      collections: [],
      excerpt: "",
      created_at: null,
      updated_at: "2026-01-01",
      metadata: {}
    };
    expect(dedupeEntries([entry, { ...entry, id: "b" }])).toHaveLength(1);
  });

  it("searches across connector roles and canonicalizes ia in memory only", () => {
    const index = {
      schema_version: 1,
      rebuilt_at: "now",
      connector_statuses: [],
      errors: [],
      entries: [
        { id: "active:a", origin: "active-vault" as const, connector_id: "active-vault", connector_name: "Active vault", vault_name: "Active vault", role: "active" as const, type: "youtube", title: "AI Video", creator: null, path: "a.md", url: null, open_uri: "a.md", tags: ["ai"], collections: ["Knowledge"], excerpt: "", created_at: null, updated_at: null, metadata: {} },
        { id: "external:c", origin: "external" as const, connector_id: "conv", connector_name: "Obsidian_Vault", vault_name: "Conversations", role: "conversations" as const, type: "conversation", title: "Chat", creator: null, path: "ChatGPT/chat.md", url: null, open_uri: "obsidian://open", tags: ["ai"], collections: ["Archive"], excerpt: "Gemini and Claude notes", created_at: null, updated_at: null, source_platform: "ChatGPT", metadata: {} },
        { id: "external:d", origin: "external" as const, connector_id: "docs", connector_name: "_Docs", vault_name: "Docs", role: "documents" as const, type: "document", title: "Spec", creator: null, path: "spec.md", url: null, open_uri: "obsidian://open", tags: ["docs"], collections: ["Document Archive"], excerpt: "requirements", created_at: null, updated_at: null, metadata: {} }
      ]
    };
    const results = new UnifiedSearchService().search(index, "claude", { role: "conversations" });
    expect(results.map((entry) => entry.connector_id)).toEqual(["conv"]);
  });

  it("coexists active vault resources with unavailable external connectors", async () => {
    const plugin = {
      settings: { ...DEFAULT_SETTINGS, vaultConnectors: [connector({ id: "missing", windowsPath: "Z:/missing-kl" })] },
      resourceRepository: { list: vi.fn(async () => [{ resource: { id: "r1", type: "website", title: "Local", creator: null, source: "local", url: null, filePath: null, thumbnail: null, tags: ["ia"], status: "active", favorite: false, completed: false, rating: null, createdAt: "2026", updatedAt: "2026", metadata: {}, collections: [], progress: 0, progress_unit: "percent", current_position: null, total_units: null, priority: "normal", related_resources: [] }, path: "Local.md", legacy: false }]) },
      loadData: vi.fn(async () => ({})),
      saveData: vi.fn(async () => undefined)
    };
    const stateManager = new PluginStateManager(plugin);
    const indexRepository = new IndexRepository(stateManager);
    const index = await new UnifiedIndexService(plugin as never, undefined, undefined, undefined, new CollectionService(), indexRepository).rebuild();
    expect(index.entries).toHaveLength(1);
    expect(index.entries[0].tags).toEqual(["ai"]);
    expect(index.connector_statuses[0].available).toBe(false);
  });
});
