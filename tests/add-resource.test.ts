import { describe, expect, it, vi } from "vitest";

vi.mock("obsidian", () => ({
  requestUrl: vi.fn(),
  TFile: class TFile {},
  normalizePath: (path: string) => path.replace(/\\/g, "/").replace(/\/+/g, "/")
}));

import { DEFAULT_SETTINGS } from "../src/core/settings";
import { KnowledgeResource } from "../src/models/KnowledgeResource";
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
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
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
      "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
      "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg"
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

describe("file extension type detection", () => {
  it("detects supported file-backed resource types", () => {
    expect(detectResourceTypeFromFilePath("Docs/report.pdf")).toBe("pdf");
    expect(detectResourceTypeFromFilePath("Slides/deck.pptx")).toBe("powerpoint");
    expect(detectResourceTypeFromFilePath("Notes/page.md")).toBe("markdown");
    expect(detectResourceTypeFromFilePath("Images/photo.png")).toBe("image");
    expect(detectResourceTypeFromFilePath("Scripts/tool.py")).toBe("script");
    expect(detectResourceTypeFromFilePath("Archives/export.zip")).toBe("archive");
  });
});
