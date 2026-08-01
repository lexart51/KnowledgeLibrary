import { describe, expect, it, vi } from "vitest";

vi.mock("obsidian", () => ({
  requestUrl: vi.fn(),
  normalizePath: (path: string) => path.replace(/\\/g, "/").replace(/\/+/g, "/"),
  TFile: class TFile {}
}));

import { KnowledgeResource } from "../src/models/KnowledgeResource";
import { ResourceDeserializer } from "../src/services/ResourceDeserializer";
import { ResourceSerializer } from "../src/services/ResourceSerializer";
import { deduplicateStoredResources, isExcludedResourcePath, StoredResource } from "../src/services/VaultResourceRepository";
import { getYouTubeThumbnailFallbacks } from "../src/ui/thumbnailFallbacks";

function resource(overrides: Partial<KnowledgeResource> = {}): KnowledgeResource {
  return {
    id: "kl_test",
    type: "youtube",
    title: "Test Video",
    creator: "Test Channel",
    source: "YouTube",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    filePath: null,
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    tags: ["ai", "video"],
    status: "active",
    favorite: true,
    completed: false,
    rating: 4,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    metadata: { videoId: "dQw4w9WgXcQ", provider: "youtube" },
    ...overrides
  };
}

describe("ResourceSerializer and ResourceDeserializer", () => {
  it("round trips canonical frontmatter", () => {
    const serializer = new ResourceSerializer();
    const deserializer = new ResourceDeserializer();
    const original = resource();
    const markdown = serializer.serialize(original, "## Notes\nUser notes stay here.");
    const parsed = deserializer.deserialize(markdown);

    expect(parsed?.resource).toEqual(original);
    expect(parsed?.body.trim()).toBe("## Notes\nUser notes stay here.");
    expect(parsed?.legacy).toBe(false);
  });

  it("converts legacy frontmatter without requiring writes", () => {
    const parsed = new ResourceDeserializer().deserialize(`---\ntitle: Legacy Video\nurl: https://youtu.be/dQw4w9WgXcQ\nvideo_id: dQw4w9WgXcQ\nchannel: Legacy Channel\nimage: https://example.com/legacy.jpg\nwatched: true\ndate_added: 2025-05-01\ntags:\n  - IA\n---\nLegacy body`);

    expect(parsed?.resource.creator).toBe("Legacy Channel");
    expect(parsed?.resource.thumbnail).toBe("https://example.com/legacy.jpg");
    expect(parsed?.resource.completed).toBe(true);
    expect(parsed?.resource.createdAt).toBe("2025-05-01");
    expect(parsed?.resource.metadata.videoId).toBe("dQw4w9WgXcQ");
    expect(parsed?.legacy).toBe(true);
    expect(parsed?.body.trim()).toBe("Legacy body");
  });
});

describe("VaultResourceRepository helpers", () => {
  it("excludes backup and system paths", () => {
    expect(isExcludedResourcePath("01 - Biblioteca/Backups/item.md")).toBe(true);
    expect(isExcludedResourcePath("01 - Biblioteca/Templates/template.md")).toBe(true);
    expect(isExcludedResourcePath(".obsidian/plugins/x.md")).toBe(true);
    expect(isExcludedResourcePath("01 - Biblioteca/Recursos/item.md")).toBe(false);
  });

  it("deduplicates by provider-specific key", () => {
    const older: StoredResource = { resource: resource({ id: "older", updatedAt: "2026-01-01T00:00:00.000Z" }), path: "older.md", legacy: false };
    const newer: StoredResource = { resource: resource({ id: "newer", updatedAt: "2026-01-03T00:00:00.000Z" }), path: "newer.md", legacy: false };

    expect(deduplicateStoredResources([older, newer])).toEqual([newer]);
  });
});

describe("YouTube thumbnail fallbacks", () => {
  it("generates hqdefault, 0, and mqdefault fallback URLs", () => {
    expect(getYouTubeThumbnailFallbacks(null, "https://youtu.be/dQw4w9WgXcQ")).toEqual([
      "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
      "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg"
    ]);
  });
});
