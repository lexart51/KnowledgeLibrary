import { describe, expect, it, vi } from "vitest";

vi.mock("obsidian", () => ({
  normalizePath: (path: string) => path.replace(/\\/g, "/").replace(/\/+/g, "/"),
  TFile: class TFile {}
}));

import { CompatibilityLayer } from "../src/services/CompatibilityLayer";
import { MigrationService } from "../src/services/MigrationService";

interface FakeFile {
  path: string;
}

function appWithFiles(files: Record<string, string>) {
  const fileEntries = Object.keys(files).map((path) => ({ path }));
  const read = vi.fn(async (file: FakeFile) => files[file.path]);

  return {
    app: {
      vault: {
        getMarkdownFiles: () => fileEntries,
        read
      }
    },
    read
  };
}

describe("CompatibilityLayer", () => {
  it("detects and converts Video Knowledge Manager notes in memory", () => {
    const result = new CompatibilityLayer().convert("YouTubes/video.md", `---\ntitle: Vkm Video\nvideo_id: dQw4w9WgXcQ\nchannel: Channel A\nwatched: true\n---\nNotes`);

    expect(result.kind).toBe("video-knowledge-manager");
    expect(result.resource?.type).toBe("youtube");
    expect(result.resource?.creator).toBe("Channel A");
    expect(result.resource?.completed).toBe(true);
    expect(result.resource?.metadata.videoId).toBe("dQw4w9WgXcQ");
  });

  it("canonicalizes legacy tags during in-memory migration reads", () => {
    const result = new CompatibilityLayer().convert("YouTubes/video.md", `---
title: Vkm Video
video_id: dQw4w9WgXcQ
tags:
  - ia
  - AI
  - unrelated
---
Notes`);

    expect(result.resource?.tags).toEqual(["ai", "unrelated"]);
  });

  it("detects Knowledge Library v5 notes", () => {
    const result = new CompatibilityLayer().convert("Knowledge Library v5/item.md", `---\ntitle: V5\nkl_version: 5\nurl: https://example.com/resource\n---\nBody`);

    expect(result.kind).toBe("knowledge-library-v5");
    expect(result.resource?.url).toBe("https://example.com/resource");
  });

  it("detects legacy WhatsApp imported notes", () => {
    const result = new CompatibilityLayer().convert("Imports/WhatsApp/share.md", `---\ntitle: Shared Link\ndate_shared: 2026-01-01\n---\nShared on WhatsApp https://example.com/story`);

    expect(result.kind).toBe("whatsapp-import");
    expect(result.resource?.url).toBe("https://example.com/story");
  });
});

describe("MigrationService", () => {
  it("analyzes the vault without modifying files", async () => {
    const { app, read } = appWithFiles({
      "YouTubes/a.md": `---\ntitle: A\nvideo_id: dQw4w9WgXcQ\nchannel: Channel\nimage: https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg\n---\nBody`,
      "YouTubes/b.md": `---\ntitle: B\nvideo_id: dQw4w9WgXcQ\nchannel: Channel\n---\nBody`,
      "Imports/WhatsApp/c.md": `---\ntitle: C\ndate_shared: 2026-01-01\nurl: not-a-url\n---\nBody`,
      "Backups/ignored.md": `---\ntitle: Ignored\nurl: https://example.com\n---\nBody`,
      "Notes/orphan.md": "Plain note"
    });

    const report = await new MigrationService(app as never).analyzeVault();

    expect(read).toHaveBeenCalledTimes(4);
    expect(report.audit.totalResources).toBe(3);
    expect(report.audit.duplicatedYouTubeIds).toEqual(["dQw4w9WgXcQ"]);
    expect(report.audit.missingThumbnails).toEqual(["Imports/WhatsApp/c.md"]);
    expect(report.audit.invalidUrls).toEqual(["Imports/WhatsApp/c.md"]);
    expect(report.audit.orphanNotes).toEqual(["Notes/orphan.md"]);
    expect(report.simulation.resourcesDetected).toHaveLength(3);
    expect(report.simulation.resourcesThatWouldBeConverted).toHaveLength(0);
    expect(report.simulation.resourcesRequiringManualReview).toHaveLength(3);
  });

  it("reports invalid YAML", async () => {
    const { app } = appWithFiles({
      "YouTubes/broken.md": `---\ntitle: Broken\n  bad indentation\n---\nBody`
    });

    const report = await new MigrationService(app as never).analyzeVault();

    expect(report.audit.invalidYaml).toEqual(["YouTubes/broken.md"]);
    expect(report.simulation.resourcesIgnored[0].reason).toContain("Invalid YAML frontmatter");
  });
});

