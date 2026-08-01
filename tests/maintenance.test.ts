import { describe, expect, it, vi } from "vitest";

vi.mock("obsidian", () => ({
  normalizePath: (path: string) => path.replace(/\\/g, "/").replace(/\/+/g, "/"),
  TFile: class TFile {}
}));

import { DEFAULT_SETTINGS } from "../src/core/settings";
import { SafeMigrationService, TagConsolidationService, ThumbnailRepairService } from "../src/services/MaintenanceServices";

class FakeFile {
  basename: string;
  extension: string;
  stat = { size: 1, mtime: 1, ctime: 1 };

  constructor(public path: string) {
    this.basename = path.replace(/\.md$/, "").split("/").pop() ?? path;
    this.extension = "md";
  }
}

function fakeApp(files: Record<string, string>) {
  const store = new Map(Object.entries(files));
  const writes: Array<{ path: string; content: string }> = [];
  const created: Array<{ path: string; content: string }> = [];
  const folders: string[] = [];
  const app = {
    vault: {
      getMarkdownFiles: () => Array.from(store.keys()).map((path) => new FakeFile(path)),
      getAbstractFileByPath: (path: string) => store.has(path) ? new FakeFile(path) : null,
      read: vi.fn(async (file: FakeFile) => store.get(file.path) ?? ""),
      modify: vi.fn(async (file: FakeFile, content: string) => {
        store.set(file.path, content);
        writes.push({ path: file.path, content });
      }),
      create: vi.fn(async (path: string, content: string) => {
        store.set(path, content);
        created.push({ path, content });
      }),
      createFolder: vi.fn(async (path: string) => {
        folders.push(path);
      })
    }
  };
  return { app, store, writes, created, folders };
}

describe("SafeMigrationService", () => {
  it("supports dry-run migration without modifying notes", async () => {
    const { app, writes, created } = fakeApp({
      "YouTubes/hermes.md": `---\ntitle: Hermes\nvideo_id: Nc0Atdjg5sE\nchannel: Hermes\nimage: https://img.youtube.com/vi/Nc0Atdjg5sE/hqdefault.jpg\nwatched: true\ntags:\n  - ia\n---\nUser body`
    });

    const report = await new SafeMigrationService(app as never, DEFAULT_SETTINGS).applyMigration(true);

    expect(report.changed).toEqual(["YouTubes/hermes.md"]);
    expect(writes).toEqual([]);
    expect(created).toEqual([]);
  });

  it("applies migration to frontmatter while preserving markdown body", async () => {
    const { app, store } = fakeApp({
      "YouTubes/hermes.md": `---\ntitle: Hermes\nvideo_id: Nc0Atdjg5sE\nchannel: Hermes\nimage: https://img.youtube.com/vi/Nc0Atdjg5sE/hqdefault.jpg\nwatched: true\ntags:\n  - ia\n---\n## Notes\nKeep this`
    });

    await new SafeMigrationService(app as never, DEFAULT_SETTINGS).applyMigration(false);
    const migrated = store.get("YouTubes/hermes.md") ?? "";

    expect(migrated).toContain("schema_version: 2");
    expect(migrated).toContain("type: youtube");
    expect(migrated).toContain("creator: Hermes");
    expect(migrated).toContain("completed: true");
    expect(migrated).toContain("  - ai");
    expect(migrated).toContain("## Notes\nKeep this");
  });
});

describe("TagConsolidationService", () => {
  it("consolidates aliases without creating duplicate tags", async () => {
    const { app, store } = fakeApp({
      "Tags/item.md": `---\nresource_id: kl_tag\ntype: website\ntitle: Tags\nurl: https://example.com\ntags:\n  - ia\n  - ai\n  - win11\n  - windows11\n  - routeros\n  - unrelated\n---\nBody`
    });

    const analysis = await new TagConsolidationService(app as never).analyze();
    expect(analysis[0].after).toEqual(["ai", "windows", "mikrotik", "unrelated"]);

    await new TagConsolidationService(app as never).consolidate(false);
    const updated = store.get("Tags/item.md") ?? "";
    expect(updated.match(/  - ai/g)?.length).toBe(1);
    expect(updated.match(/  - windows/g)?.length).toBe(1);
    expect(updated).toContain("  - mikrotik");
    expect(updated).toContain("  - unrelated");
  });
});

describe("ThumbnailRepairService", () => {
  it("repairs missing Hermes YouTube thumbnail values deterministically", async () => {
    const { app, store } = fakeApp({
      "Hermes/one.md": `---\nresource_id: kl_one\ntype: youtube\ntitle: One\nurl: https://www.youtube.com/watch?v=Nc0Atdjg5sE\nthumbnail: null\nmetadata:\n  videoId: Nc0Atdjg5sE\n---\nBody`,
      "Hermes/two.md": `---\nresource_id: kl_two\ntype: youtube\ntitle: Two\nurl: https://www.youtube.com/watch?v=97IO4He9PPc\nthumbnail: https://example.com/bad.jpg\nmetadata:\n  videoId: 97IO4He9PPc\n---\nBody`
    });

    const service = new ThumbnailRepairService(app as never);
    expect(await service.analyze()).toEqual([
      { path: "Hermes/one.md", videoId: "Nc0Atdjg5sE", thumbnail: "https://img.youtube.com/vi/Nc0Atdjg5sE/hqdefault.jpg" },
      { path: "Hermes/two.md", videoId: "97IO4He9PPc", thumbnail: "https://img.youtube.com/vi/97IO4He9PPc/hqdefault.jpg" }
    ]);

    await service.repair(false);
    expect(store.get("Hermes/one.md")).toContain("thumbnail: \"https://img.youtube.com/vi/Nc0Atdjg5sE/hqdefault.jpg\"");
    expect(store.get("Hermes/two.md")).toContain("thumbnail: \"https://img.youtube.com/vi/97IO4He9PPc/hqdefault.jpg\"");
  });
});
