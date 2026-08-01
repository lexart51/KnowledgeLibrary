import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("obsidian", () => ({
  normalizePath: (path: string) => path.replace(/\\/g, "/").replace(/\/+/g, "/"),
  ItemView: class ItemView {
    app = { vault: { getAbstractFileByPath: () => null }, workspace: { getLeaf: () => ({ openFile: vi.fn() }) } };
    contentEl = {};
  },
  Notice: class Notice {
    constructor(_message: string) {}
  },
  Plugin: class Plugin {},
  TFile: class TFile {},
  WorkspaceLeaf: class WorkspaceLeaf {}
}));

import { DEFAULT_SETTINGS } from "../src/core/settings";
import { KnowledgeResource } from "../src/models/KnowledgeResource";
import { TagService } from "../src/services/TagService";
import { CollectionService } from "../src/services/CollectionService";
import { StoredResource } from "../src/services/VaultResourceRepository";
import { KnowledgeLibraryView } from "../src/ui/KnowledgeLibraryView";

function resource(index: number, tags: string[] = ["ai"]): StoredResource {
  const date = new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString();
  const item: KnowledgeResource = {
    id: `kl_${index}`,
    type: "website",
    title: `Resource ${index}`,
    creator: null,
    source: "example.com",
    url: `https://example.com/${index}`,
    filePath: null,
    thumbnail: null,
    tags,
    status: "active",
    favorite: false,
    completed: false,
    rating: null,
    createdAt: date,
    updatedAt: date,
    metadata: {}
  };
  return { resource: item, path: `Resource ${index}.md`, legacy: false };
}

function viewWithResources(items: StoredResource[]): KnowledgeLibraryView {
  const tagService = new TagService();
  const view = new KnowledgeLibraryView({} as never, {
    settings: DEFAULT_SETTINGS,
    tagService,
    collectionService: new CollectionService(),
    resourceRepository: { list: vi.fn(async () => items) },
    openAddResourceModal: vi.fn()
  } as never);

  (view as unknown as { resources: StoredResource[] }).resources = items;
  return view;
}

describe("KnowledgeLibraryView scrolling and tags", () => {
  it("keeps all 200 mock items available to the library card pipeline", () => {
    const view = viewWithResources(Array.from({ length: 200 }, (_, index) => resource(index)));

    expect((view as unknown as { getFilteredResources: () => StoredResource[] }).getFilteredResources()).toHaveLength(200);
  });

  it("canonicalizes legacy ia filter values without displaying ia beside ai", () => {
    const view = viewWithResources([resource(1, ["ia"]), resource(2, ["AI", "ia"]), resource(3, ["project notes"])]);
    const tags = (view as unknown as { getAllTags: () => string[] }).getAllTags();

    expect(tags).toEqual(["ai", "project-notes"]);

    (view as unknown as { filters: { tag: string } }).filters.tag = "ia";
    expect((view as unknown as { getFilteredResources: () => StoredResource[] }).getFilteredResources()).toHaveLength(2);
  });

  it("filters missing local files without modifying resources", () => {
    const view = viewWithResources([
      resource(1),
      resource(2, ["ai"])
    ]);
    (view as unknown as { resources: StoredResource[] }).resources[1].resource.filePath = "Missing/report.pdf";
    (view as unknown as { resources: StoredResource[] }).resources[1].resource.type = "pdf";
    (view as unknown as { filters: { missingOnly: boolean } }).filters.missingOnly = true;

    expect((view as unknown as { getFilteredResources: () => StoredResource[] }).getFilteredResources().map((item) => item.path)).toEqual(["Resource 2.md"]);
  });

  it("uses the Obsidian content element and a scroll container with regression styles", () => {
    const source = readFileSync(join(process.cwd(), "src/ui/KnowledgeLibraryView.ts"), "utf8");
    const css = readFileSync(join(process.cwd(), "src/styles.css"), "utf8");

    expect(source).toContain("this.contentEl.empty()");
    expect(source).toContain('this.contentEl.addClass("knowledge-library-view")');
    expect(source).toContain("knowledge-library-scroll");
    expect(css).toMatch(/\.knowledge-library-scroll\s*{[^}]*height:\s*100%;[^}]*min-height:\s*0;[^}]*overflow-y:\s*auto;/s);
    expect(css).toMatch(/\.knowledge-library-view\s*{[^}]*height:\s*100%;[^}]*min-height:\s*0;[^}]*overflow:\s*visible;/s);
  });
});
