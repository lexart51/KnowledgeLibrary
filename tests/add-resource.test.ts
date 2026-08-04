import { describe, expect, it, vi } from "vitest";

vi.mock("obsidian", () => ({
  requestUrl: vi.fn(),
  TFile: class TFile {},
  normalizePath: (path: string) => path.replace(/\\/g, "/").replace(/\/+/g, "/")
}));

import { TFile } from "obsidian";
import { DEFAULT_SETTINGS } from "../src/core/settings";
import { KnowledgeResource } from "../src/models/KnowledgeResource";
import { UnifiedIndexEntry } from "../src/models/VaultConnector";
import { FileProvider } from "../src/providers/FileProvider";
import { WebsiteProvider } from "../src/providers/WebsiteProvider";
import { YouTubeProvider } from "../src/providers/YouTubeProvider";
import { AddResourceService } from "../src/services/AddResourceService";
import { ProviderRegistry } from "../src/services/ProviderRegistry";
import { ResourceService } from "../src/services/ResourceService";
import { TagService } from "../src/services/TagService";
import { StoredResource } from "../src/services/VaultResourceRepository";
import { detectResourceTypeFromFilePath } from "../src/utils/fileTypes";

function baseResource(overrides: Partial<KnowledgeResource> = {}): KnowledgeResource {
  return {
    id: "kl_existing",
    type: "youtube",
    title: "Existing",
    creator: null,
    source: "YouTube",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    filePath: null,
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    tags: ["ai"],
    status: "active",
    favorite: false,
    completed: false,
    rating: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    metadata: { videoId: "dQw4w9WgXcQ" },
    ...overrides
  };
}

function service(existing: StoredResource[] = [], youtubeFetch = vi.fn().mockRejectedValue(new Error("offline")), websiteFetch = vi.fn().mockRejectedValue(new Error("offline"))) {
  const registry = new ProviderRegistry();
  registry.register(new YouTubeProvider(youtubeFetch));
  registry.register(new WebsiteProvider(websiteFetch));
  registry.register(new FileProvider());
  const created: StoredResource[] = [];
  const repository = {
    create: vi.fn(async (resource: KnowledgeResource) => {
      const stored = { resource, path: `${resource.title}.md`, legacy: false };
      created.push(stored);
      return stored;
    }),
    list: vi.fn(async () => [...existing, ...created]),
    findYouTubeByVideoId: vi.fn(async (videoId: string) => existing.find((item) => item.resource.metadata.videoId === videoId) ?? null)
  };
  const app = {
    vault: {
      getMarkdownFiles: () => [],
      getAbstractFileByPath: () => null
    },
    metadataCache: {
      getFileCache: () => null
    }
  };

  return {
    add: new AddResourceService(app as never, DEFAULT_SETTINGS, new ResourceService(registry, new TagService()), repository as never, new TagService()),
    repository,
    created
  };
}

describe("AddResourceService", () => {
  it("normalizes YouTube URLs with pp and uses fallback behavior when oEmbed fails", async () => {
    const { add } = service();
    const result = await add.addResource({ kind: "youtube", url: "https://m.youtube.com/watch?v=dQw4w9WgXcQ&pp=abc&si=noise&feature=share&t=42", tags: ["ia, ai"] });

    expect(result.duplicate).toBe(false);
    expect(result.resource.url).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(result.resource.title).toBe("YouTube Video dQw4w9WgXcQ");
    expect(result.resource.status).toBe("active");
    expect(result.resource.tags).toEqual(["knowledge-library", "ai"]);
    expect(result.resource.metadata.thumbnailFallbacks).toEqual([
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/0.jpg",
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg"
    ]);
  });

  it("prevents duplicate YouTube resources by video id", async () => {
    const existing = { resource: baseResource(), path: "Existing.md", legacy: false };
    const { add, repository } = service([existing]);
    const result = await add.addResource({ kind: "youtube", url: "https://youtu.be/dQw4w9WgXcQ?pp=abc" });

    expect(result.duplicate).toBe(true);
    expect(result.stored).toBe(existing);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("prevents duplicate local file resources by normalized vault path", async () => {
    const existing = { resource: baseResource({ type: "pdf", filePath: "Docs/report.pdf", url: null, metadata: { filename: "report.pdf", fileSizeBytes: 1, modifiedTime: 2 } }), path: "Report.md", legacy: false };
    const { add, repository } = service([existing]);
    const result = await add.addResource({ kind: "pdf", filePath: "Docs\\report.pdf" });

    expect(result.duplicate).toBe(true);
    expect(result.stored).toBe(existing);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("prevents duplicate local file resources after a move when metadata matches", async () => {
    const existing = { resource: baseResource({ type: "pdf", filePath: "Old/report.pdf", url: null, metadata: { filename: "report.pdf", fileSizeBytes: 10, modifiedTime: 20 } }), path: "Report.md", legacy: false };
    const movedFile = Object.assign(new TFile(), { path: "New/report.pdf", basename: "report", extension: "pdf", stat: { size: 10, ctime: 1, mtime: 20 } });
    const { add, repository } = service([existing]);
    (add as unknown as { app: { vault: { getAbstractFileByPath: (path: string) => unknown } } }).app.vault.getAbstractFileByPath = (path: string) => path === "New/report.pdf" ? movedFile : null;

    const result = await add.addResource({ kind: "pdf", filePath: "New/report.pdf" });

    expect(result.duplicate).toBe(true);
    expect(result.stored).toBe(existing);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("prevents duplicate websites by canonical URL", async () => {
    const existing = { resource: baseResource({ type: "website", url: "https://example.com/page", metadata: { canonicalUrl: "https://example.com/page" } }), path: "Website.md", legacy: false };
    const { add, repository } = service([existing]);
    const result = await add.addResource({ kind: "website", url: "https://example.com/page?utm_source=x#section" });

    expect(result.duplicate).toBe(true);
    expect(result.stored).toBe(existing);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("canonicalizes ia to ai and removes duplicate tags during wizard creation", async () => {
    const { add } = service();
    const result = await add.addResource({ kind: "website", url: "https://example.com", tags: ["ia, AI, project notes, project-notes"] });

    expect(result.resource.tags).toEqual(["knowledge-library", "ai", "project-notes"]);
  });
});

function externalEntry(overrides: Partial<UnifiedIndexEntry> = {}): UnifiedIndexEntry {
  return {
    id: "kl_ext_1",
    origin: "external",
    connector_id: "conversation-archive",
    connector_name: "Obsidian_Vault",
    vault_name: "Obsidian_Vault",
    role: "conversations",
    type: "conversation",
    title: "Discussing WireGuard failover",
    creator: null,
    path: "ChatGPT/wireguard.md",
    url: null,
    open_uri: "obsidian://open?vault=Obsidian_Vault&file=ChatGPT%2Fwireguard.md",
    tags: ["mikrotik"],
    collections: [],
    excerpt: "We discussed WireGuard failover configuration.",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    metadata: { platform: "chatgpt" },
    ...overrides
  };
}

describe("AddResourceService external promotion", () => {
  it("promotes an external connector entry into a tracked resource", async () => {
    const { add, repository } = service();
    const result = await add.promoteExternalEntry(externalEntry());

    expect(result.duplicate).toBe(false);
    expect(result.resource.title).toBe("Discussing WireGuard failover");
    expect(result.resource.type).toBe("markdown");
    expect(result.resource.url).toBe("obsidian://open?vault=Obsidian_Vault&file=ChatGPT%2Fwireguard.md");
    expect(result.resource.source).toBe("Obsidian_Vault");
    expect(result.resource.tags).toContain("mikrotik");
    expect(repository.create).toHaveBeenCalledTimes(1);
  });

  it("maps document-role entries to their real resource type", async () => {
    const { add } = service();
    const result = await add.promoteExternalEntry(externalEntry({ id: "kl_ext_2", role: "documents", type: "pdf", title: "Contract.pdf", open_uri: "obsidian://open?vault=_Docs&file=Contract.pdf" }));

    expect(result.resource.type).toBe("pdf");
  });

  it("does not duplicate an entry already promoted to the library", async () => {
    const existing = { resource: baseResource({ type: "markdown", url: "obsidian://open?vault=Obsidian_Vault&file=ChatGPT%2Fwireguard.md" }), path: "Discussing WireGuard failover.md", legacy: false };
    const { add, repository } = service([existing]);
    const result = await add.promoteExternalEntry(externalEntry());

    expect(result.duplicate).toBe(true);
    expect(result.stored).toBe(existing);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("refuses to promote active-vault entries", async () => {
    const { add } = service();
    await expect(add.promoteExternalEntry(externalEntry({ origin: "active-vault" }))).rejects.toThrow(/external connector entries/);
  });
});

describe("file extension type detection", () => {
  it("detects supported file-backed resource types", () => {
    expect(detectResourceTypeFromFilePath("Docs/report.pdf")).toBe("pdf");
    expect(detectResourceTypeFromFilePath("Slides/deck.pptx")).toBe("powerpoint");
    expect(detectResourceTypeFromFilePath("Docs/spec.docx")).toBe("document");
    expect(detectResourceTypeFromFilePath("Books/manual.epub")).toBe("book");
    expect(detectResourceTypeFromFilePath("Notes/page.md")).toBe("markdown");
    expect(detectResourceTypeFromFilePath("Images/photo.png")).toBe("image");
    expect(detectResourceTypeFromFilePath("Scripts/tool.py")).toBe("script");
    expect(detectResourceTypeFromFilePath("Archives/export.zip")).toBe("archive");
  });

  it("adds EPUB files as book resources with local file metadata", async () => {
    class LocalFile {
      basename = "manual";
      extension = "epub";
      stat = { size: 1234, ctime: 100, mtime: 200 };
      constructor(public path: string) {}
    }
    const registry = new ProviderRegistry();
    registry.register(new FileProvider());
    const repository = {
      create: vi.fn(async (resource: KnowledgeResource) => ({ resource, path: `${resource.title}.md`, legacy: false })),
      list: vi.fn(async () => [])
    };
    const app = {
      vault: {
        getMarkdownFiles: () => [],
        getAbstractFileByPath: (path: string) => path === "Books/manual.epub" ? new LocalFile(path) : null
      },
      metadataCache: { getFileCache: () => null }
    };

    const add = new AddResourceService(app as never, DEFAULT_SETTINGS, new ResourceService(registry, new TagService()), repository as never, new TagService());
    const result = await add.addResource({ kind: "book", filePath: "Books/manual.epub", title: "Manual", creator: "Author", publisher: "Pub", edition: "2", isbn: "123" });

    expect(result.resource.type).toBe("book");
    expect(result.resource.filePath).toBe("Books/manual.epub");
    expect(result.resource.metadata).toMatchObject({ publisher: "Pub", edition: "2", isbn: "123", extension: "epub", documentFormat: "EPUB" });
  });
});
