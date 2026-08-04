import { describe, expect, it, vi } from "vitest";

vi.mock("obsidian", () => ({
  requestUrl: vi.fn(),
  normalizePath: (path: string) => path.replace(/\\/g, "/").replace(/\/+/g, "/"),
  ItemView: class ItemView {
    app = { vault: { getAbstractFileByPath: () => null }, workspace: { getLeaf: () => ({ openFile: vi.fn() }) } };
    contentEl = {};
  },
  Notice: class Notice { constructor(_message: string) {} },
  TFile: class TFile {},
  WorkspaceLeaf: class WorkspaceLeaf {}
}));

import { KnowledgeResource } from "../src/models/KnowledgeResource";
import { CollectionService } from "../src/services/CollectionService";
import { ProgressService } from "../src/services/ProgressService";
import { RelationshipService } from "../src/services/RelationshipService";
import { ResourceDeserializer } from "../src/services/ResourceDeserializer";
import { ResourceSerializer } from "../src/services/ResourceSerializer";
import { StoredResource } from "../src/services/VaultResourceRepository";
import { calculateDashboardStats } from "../src/ui/KnowledgeDashboardView";
import { KnowledgeLibraryView } from "../src/ui/KnowledgeLibraryView";
import { DEFAULT_SETTINGS } from "../src/core/settings";
import { TagService } from "../src/services/TagService";

function resource(overrides: Partial<KnowledgeResource> = {}): KnowledgeResource {
  return {
    id: "kl_test",
    type: "website",
    title: "Resource",
    creator: null,
    source: "example.com",
    url: "https://example.com",
    filePath: null,
    thumbnail: null,
    tags: ["ai"],
    status: "active",
    favorite: false,
    completed: false,
    rating: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    metadata: {},
    collections: [],
    progress: 0,
    progress_unit: "percent",
    current_position: null,
    total_units: null,
    priority: "normal",
    related_resources: [],
    ...overrides
  };
}

function stored(overrides: Partial<KnowledgeResource> = {}, path = "Resource.md"): StoredResource {
  return { resource: resource(overrides), path, legacy: false };
}

function viewWithResources(items: StoredResource[]): KnowledgeLibraryView {
  const view = new KnowledgeLibraryView({} as never, {
    settings: DEFAULT_SETTINGS,
    tagService: new TagService(),
    collectionService: new CollectionService(),
    resourceRepository: { list: vi.fn(async () => items) },
    openAddResourceModal: vi.fn()
  } as never);
  (view as unknown as { resources: StoredResource[] }).resources = items;
  return view;
}

describe("CollectionService", () => {
  it("normalizes and deduplicates collection names", () => {
    expect(new CollectionService().normalizeCollections([" Research ", "research", "Deep  Work", ""])).toEqual(["Deep Work", "Research"]);
  });

  it("plans collection rename and merge operations", () => {
    const service = new CollectionService();
    const resources = [stored({ id: "a", collections: ["Research"] }), stored({ id: "b", collections: ["Research", "AI"] })];

    expect(service.planRename(resources, "Research", "Projects").changes.map((change) => change.after)).toEqual([["Projects"], ["AI", "Projects"]]);
    expect(service.planMerge(resources, ["Research", "AI"], "Knowledge").changes.map((change) => change.after)).toEqual([["Knowledge"], ["Knowledge"]]);
  });

  it("prevents duplicate collection names after normalization", () => {
    expect(() => new CollectionService().planRename([stored({ collections: ["AI"] }), stored({ collections: ["ML"] })], "ML", " ai ")).toThrow(/already exists/);
  });
});

describe("ProgressService", () => {
  it("calculates percentage from current and total units", () => {
    expect(new ProgressService().normalize({ current_position: 25, total_units: 100, progress_unit: "pages" }).progress).toBe(25);
  });

  it("synchronizes completed and progress", () => {
    const service = new ProgressService();
    expect(service.normalize({ completed: true, progress: 40 }).progress).toBe(100);
    expect(service.apply(resource({ completed: true, progress: 100 }), { completed: false }).progress).toBe(0);
  });

  it("rejects invalid progress values", () => {
    const service = new ProgressService();
    expect(() => service.normalize({ progress: -1 })).toThrow(/Progress/);
    expect(() => service.normalize({ current_position: 1, total_units: 0 })).toThrow(/Total units/);
  });
});

describe("RelationshipService", () => {
  it("rejects self-references and exact duplicates", () => {
    const service = new RelationshipService();
    expect(() => service.addRelationship(resource({ id: "a" }), { resource_id: "a", relationship_type: "related", note: "" })).toThrow(/itself/);
    const withRelationship = service.addRelationship(resource({ id: "a" }), { resource_id: "b", relationship_type: "explains", note: "note" });
    expect(() => service.addRelationship(withRelationship, { resource_id: "b", relationship_type: "explains", note: "note" })).toThrow(/already exists/);
  });

  it("finds incoming and outgoing relationships and tolerates missing targets", () => {
    const service = new RelationshipService();
    const a = stored({ id: "a", related_resources: [{ resource_id: "missing", relationship_type: "related", note: "" }] });
    const b = stored({ id: "b", related_resources: [{ resource_id: "a", relationship_type: "source", note: "" }] });
    expect(service.outgoing(a.resource)).toHaveLength(1);
    expect(service.incoming([a, b], "a").map((item) => item.from.id)).toEqual(["b"]);
    expect(service.resolve([a, b], "missing")).toBeNull();
  });
});

describe("Resource storage extensions", () => {
  it("round trips collections progress priority and relationships", () => {
    const original = resource({ collections: ["Research"], progress: 50, progress_unit: "pages", current_position: 5, total_units: 10, priority: "high", related_resources: [{ resource_id: "b", relationship_type: "complements", note: "pair" }] });
    const parsed = new ResourceDeserializer().deserialize(new ResourceSerializer().serialize(original, "Body"));

    expect(parsed?.resource.collections).toEqual(["Research"]);
    expect(parsed?.resource.progress).toBe(50);
    expect(parsed?.resource.completed).toBe(false);
    expect(parsed?.resource.priority).toBe("high");
    expect(parsed?.resource.related_resources).toEqual(original.related_resources);
    expect(parsed?.body.trim()).toBe("Body");
  });

  it("preserves unknown frontmatter and Markdown body", () => {
    const markdown = new ResourceSerializer().serialize(resource({ title: "Updated" }), "# Notes", { custom_field: "keep", title: "Old" });

    expect(markdown).toContain("custom_field: keep");
    expect(markdown).toContain("title: Updated");
    expect(markdown).toContain("# Notes");
  });
});

describe("Library collection and progress behavior", () => {
  it("filters by collection and progress", () => {
    const view = viewWithResources([stored({ id: "a", collections: ["Research"], progress: 0 }), stored({ id: "b", collections: ["Projects"], progress: 50 })]);
    (view as unknown as { filters: { collection: string; progress: string } }).filters.collection = "projects";
    (view as unknown as { filters: { collection: string; progress: string } }).filters.progress = "in progress";

    expect((view as unknown as { getFilteredResources: () => StoredResource[] }).getFilteredResources().map((item) => item.resource.id)).toEqual(["b"]);
  });

  it("sorts by priority", () => {
    const view = viewWithResources([stored({ id: "low", priority: "low" }), stored({ id: "high", priority: "high" })]);
    (view as unknown as { filters: { sort: string } }).filters.sort = "priority";

    expect((view as unknown as { getFilteredResources: () => StoredResource[] }).getFilteredResources().map((item) => item.resource.id)).toEqual(["high", "low"]);
  });
});

describe("Dashboard statistics", () => {
  it("summarizes resources from vault data", () => {
    const stats = calculateDashboardStats([
      stored({ id: "a", type: "pdf", collections: ["Research"], progress: 0, favorite: true, filePath: "missing.pdf" }),
      stored({ id: "b", type: "book", collections: ["Research"], progress: 50, priority: "high" }),
      stored({ id: "c", type: "website", completed: true, progress: 100 })
    ], new CollectionService(), () => false);

    expect(stats.total).toBe(3);
    expect(stats.byType.pdf).toBe(1);
    expect(stats.byCollection.Research).toBe(2);
    expect(stats.notStarted).toBe(1);
    expect(stats.inProgress).toBe(1);
    expect(stats.completed).toBe(1);
    expect(stats.favorites).toBe(1);
    expect(stats.highPriority).toBe(1);
    expect(stats.missingFiles).toBe(1);
  });

  it("lists in-progress, non-completed resources as continue learning, most recently updated first", () => {
    const stats = calculateDashboardStats([
      stored({ id: "a", progress: 0 }),
      stored({ id: "b", progress: 50, updatedAt: "2026-01-02T00:00:00.000Z" }),
      stored({ id: "c", progress: 75, updatedAt: "2026-01-03T00:00:00.000Z" }),
      stored({ id: "d", completed: true, progress: 100 })
    ]);

    expect(stats.continueLearning.map((item) => item.resource.id)).toEqual(["c", "b"]);
  });
});
