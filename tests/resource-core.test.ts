import { describe, expect, it, vi } from "vitest";

vi.mock("obsidian", () => ({
  requestUrl: vi.fn()
}));

import { ProviderRegistry } from "../src/services/ProviderRegistry";
import { TagService } from "../src/services/TagService";
import { FileProvider } from "../src/providers/FileProvider";
import { WebsiteProvider } from "../src/providers/WebsiteProvider";
import { parseYouTubeUrl, YouTubeProvider } from "../src/providers/YouTubeProvider";

describe("YouTubeProvider", () => {
  it("normalizes youtube.com URLs and removes tracking/query noise including pp", async () => {
    const provider = new YouTubeProvider(vi.fn().mockRejectedValue(new Error("offline")));

    const resource = await provider.createResource({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=newsletter&pp=ygUIbm8tbm9pc2U%3D",
      tags: ["video"]
    });

    expect(resource.url).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(resource.thumbnail).toBe("https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(resource.title).toBe("YouTube Video dQw4w9WgXcQ");
    expect(resource.status).toBe("active");
    expect(resource.metadata.videoId).toBe("dQw4w9WgXcQ");
  });

  it("normalizes youtu.be URLs", () => {
    expect(parseYouTubeUrl("https://youtu.be/dQw4w9WgXcQ?si=abc123")?.canonicalUrl).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );
  });
});

describe("TagService", () => {
  it("merges ia into ai", () => {
    const tags = new TagService().normalizeTags(["ia"]);

    expect(tags).toEqual(["ai"]);
  });

  it("normalizes tags and never returns duplicates", () => {
    const tags = new TagService().normalizeTags([" AI ", "ia", "Artificial Intelligence", "project notes", "project-notes"]);

    expect(tags).toEqual(["ai", "project-notes"]);
  });
});

describe("ProviderRegistry", () => {
  it("selects the first provider that can handle input", () => {
    const registry = new ProviderRegistry();
    registry.register(new YouTubeProvider(vi.fn()));
    registry.register(new WebsiteProvider());
    registry.register(new FileProvider());

    expect(registry.selectProvider({ url: "https://youtu.be/dQw4w9WgXcQ" })?.id).toBe("youtube");
    expect(registry.selectProvider({ url: "https://example.com/a-page" })?.id).toBe("website");
    expect(registry.selectProvider({ filePath: "D:/notes/example.pdf" })?.id).toBe("file");
    expect(registry.selectProvider({ title: "No source" })).toBeNull();
  });
});
