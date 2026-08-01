import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

import { UnifiedIndexEntry, UnifiedKnowledgeIndex } from "../src/models/VaultConnector";
import { highlightMatchedTerms, SearchQueryParser, SearchRankingService, suppressDuplicates } from "../src/services/SearchRankingService";
import { serializeSavedSearch } from "../src/services/SavedSearchService";
import { overviewCounts } from "../src/ui/UniversalSearchView";

const options = {
  activeVaultBoost: 80,
  favoriteBoost: 60,
  recentBoost: 40,
  duplicateSuppression: true,
  resultLimit: 20000,
  excerptLength: 260
};

function entry(id: string, overrides: Partial<UnifiedIndexEntry> = {}): UnifiedIndexEntry {
  return {
    id,
    origin: "external",
    connector_id: "obsidian",
    connector_name: "Obsidian_Vault",
    vault_name: "Obsidian_Vault",
    role: "conversations",
    type: "conversation",
    title: `Entry ${id}`,
    creator: null,
    path: `ChatGPT/${id}.md`,
    url: null,
    open_uri: "obsidian://open",
    tags: [],
    collections: [],
    excerpt: "",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    metadata: {},
    ...overrides
  };
}

function index(entries: UnifiedIndexEntry[]): UnifiedKnowledgeIndex {
  return {
    schema_version: 1,
    rebuilt_at: "2026-08-01T00:00:00.000Z",
    entries,
    connector_statuses: [
      { connector: { id: "obsidian", displayName: "Obsidian_Vault", role: "conversations", windowsPath: "D:/Vault", enabled: true, includePatterns: [], excludePatterns: [], preferredNoteType: "conversation", icon: "msg", colorToken: "var(--text-muted)" }, available: true, path: "D:/Vault", vaultName: "Obsidian_Vault", error: null, lastScanAt: "2026", indexedItemCount: 1 },
      { connector: { id: "offline", displayName: "_Docs", role: "documents", windowsPath: "D:/Docs", enabled: true, includePatterns: [], excludePatterns: [], preferredNoteType: "document", icon: "file", colorToken: "var(--text-muted)" }, available: false, path: null, vaultName: "_Docs", error: "offline", lastScanAt: null, indexedItemCount: 0 }
    ],
    errors: []
  };
}

describe("universal search ranking", () => {
  it("prioritizes exact title and title-start matches deterministically", () => {
    const service = new SearchRankingService();
    const results = service.search(index([
      entry("excerpt", { title: "Notes", excerpt: "wireguard" }),
      entry("start", { title: "WireGuard tunnels" }),
      entry("exact", { title: "wireguard" })
    ]), "wireguard", options);

    expect(results.map((result) => result.entry.id)).toEqual(["exact", "start", "excerpt"]);
  });

  it("boosts tags collections creator headings excerpts active vault favorite priority and recency", () => {
    const service = new SearchRankingService();
    const results = service.search(index([
      entry("plain", { title: "Reference", excerpt: "security" }),
      entry("tag", { title: "Reference", tags: ["security"] }),
      entry("collection", { title: "Reference", collections: ["Security"] }),
      entry("creator", { title: "Reference", creator: "Security Team" }),
      entry("heading", { title: "Reference", metadata: { headings: ["Security plan"] } }),
      entry("excerpt", { title: "Reference", excerpt: "security note" }),
      entry("active", { origin: "active-vault", connector_id: "active-vault", connector_name: "Active vault", vault_name: "Active vault", role: "active", title: "Reference security", favorite: true, priority: "high", updated_at: new Date().toISOString() })
    ]), "security", options);

    expect(results[0].entry.id).toBe("active");
    expect(results.find((result) => result.entry.id === "tag")?.score).toBeGreaterThan(results.find((result) => result.entry.id === "excerpt")?.score ?? 0);
    expect(results.find((result) => result.entry.id === "collection")?.matchedFields).toContain("collections");
    expect(results.find((result) => result.entry.id === "heading")?.matchedFields).toContain("headings");
  });

  it("penalizes unavailable connectors and missing resources", () => {
    const service = new SearchRankingService();
    const results = service.search(index([
      entry("available", { title: "Network Plan" }),
      entry("offline", { connector_id: "offline", connector_name: "_Docs", vault_name: "_Docs", role: "documents", title: "Network Plan" }),
      entry("missing", { title: "Network Plan", status: "unavailable" })
    ]), "network", options);

    expect(results[0].entry.id).toBe("available");
    expect(results.at(-1)?.entry.id).toBe("offline");
  });

  it("suppresses duplicates by resource id video id url and file path", () => {
    const resource = entry("a", { metadata: { resourceId: "r1" } });
    const duplicate = entry("b", { origin: "active-vault", connector_id: "active-vault", connector_name: "Active vault", vault_name: "Active vault", role: "active", metadata: { resourceId: "r1" } });
    expect(suppressDuplicates([{ entry: resource, score: 1, matchedFields: [], suppressedDuplicates: [] }, { entry: duplicate, score: 2, matchedFields: [], suppressedDuplicates: [] }])).toHaveLength(1);

    const results = new SearchRankingService().search(index([
      entry("yt1", { title: "Hermes", metadata: { videoId: "Nc0Atdjg5sE" } }),
      entry("yt2", { title: "Hermes", metadata: { videoId: "Nc0Atdjg5sE" } })
    ]), "hermes", options);
    expect(results).toHaveLength(1);
    expect(results[0].suppressedDuplicates).toHaveLength(1);
  });

  it("searches 10000 entries within a reasonable threshold", () => {
    const entries = Array.from({ length: 10000 }, (_, item) => entry(String(item), { title: item === 9999 ? "Unique Mikrotik PDF" : `Noise ${item}`, type: item === 9999 ? "pdf" : "conversation" }));
    const started = performance.now();
    const results = new SearchRankingService().search(index(entries), "mikrotik type:pdf", options);
    expect(results[0].entry.title).toBe("Unique Mikrotik PDF");
    expect(performance.now() - started).toBeLessThan(750);
  });
});

describe("universal query syntax and presentation helpers", () => {
  it("parses filters including quoted values", () => {
    const parsed = new SearchQueryParser().parse('retirement collection:"Retirement Automation" source:Obsidian_Vault favorite:true');
    expect(parsed.text).toBe("retirement");
    expect(parsed.filters.collection).toBe("retirement automation");
    expect(parsed.filters.source).toBe("obsidian_vault");
    expect(parsed.filters.favorite).toBe("true");
  });

  it("filters by platform role source vault type tag collection status favorite progress and priority", () => {
    const service = new SearchRankingService();
    const data = index([entry("chat", { title: "Hermes", source_platform: "ChatGPT", role: "conversations", type: "conversation", tags: ["ai"], collections: ["Archive"], favorite: true, progress: 100, completed: true, priority: "high" })]);
    expect(service.search(data, "hermes platform:chatgpt role:conversations source:Obsidian_Vault vault:Obsidian_Vault type:conversation tag:ai collection:archive status:active favorite:true progress:completed priority:high", options)).toHaveLength(1);
  });

  it("highlights matched terms safely", () => {
    expect(highlightMatchedTerms("<Hermes> plan", ["hermes"])).toContain("knowledge-library-search-mark");
    expect(highlightMatchedTerms("<Hermes> plan", ["hermes"])).toContain("&lt;");
  });

  it("serializes saved searches without vault writes", () => {
    expect(serializeSavedSearch("Security", "tag:security", "compact", "relevance")).toEqual({ name: "Security", query: "tag:security", displayMode: "compact", sortMode: "relevance" });
  });

  it("counts active vault plus three external connector roles", () => {
    const counts = overviewCounts(index([
      entry("active", { origin: "active-vault", connector_id: "active-vault", connector_name: "Active vault", vault_name: "Active vault", role: "active" }),
      entry("res", { connector_id: "youtube", connector_name: "YouTubes", vault_name: "YouTubes", role: "resources" }),
      entry("conv", { connector_id: "obsidian", connector_name: "Obsidian_Vault", vault_name: "Obsidian_Vault", role: "conversations" }),
      entry("doc", { connector_id: "docs", connector_name: "_Docs", vault_name: "_Docs", role: "documents" })
    ]));
    expect(counts).toMatchObject({ active: 1, resources: 1, conversations: 1, documents: 1, available: 1, unavailable: 1 });
  });

  it("declares keyboard navigation stale-query cancellation and grouped display hooks", () => {
    const source = readFileSync(join(process.cwd(), "src/ui/UniversalSearchView.ts"), "utf8");
    expect(source).toContain('event.key === "ArrowDown"');
    expect(source).toContain('event.key === "ArrowUp"');
    expect(source).toContain('event.key === "Enter"');
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain("sequence === this.sequence");
    expect(source).toContain("grouped-role");
    expect(source).toContain("grouped-vault");
    expect(source).toContain("grouped-source");
  });
});
