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
import { KnowledgeResource } from "../src/models/KnowledgeResource";
import { StoredResource } from "../src/services/VaultResourceRepository";
import {
  activityTimeline,
  buildHomeEntries,
  continueLearningEntries,
  favoriteCollections,
  formatDisplayDate,
  homeOverviewCounts,
  isContinueLearningEligible,
  suppressHomeDuplicates,
  topTags
} from "../src/ui/KnowledgeHomeView";

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function entry(id: string, overrides: Partial<UnifiedIndexEntry> = {}): UnifiedIndexEntry {
  return {
    id,
    origin: "external",
    connector_id: "c",
    connector_name: "YouTubes",
    vault_name: "YouTubes",
    role: "resources",
    type: "youtube",
    title: `Entry ${id}`,
    creator: null,
    path: `${id}.md`,
    url: null,
    open_uri: "obsidian://open",
    tags: [],
    collections: [],
    excerpt: "",
    created_at: "2026-08-01T10:00:00.000Z",
    updated_at: "2026-08-01T10:00:00.000Z",
    metadata: {},
    ...overrides
  };
}

function storedResource(id: string, overrides: Partial<KnowledgeResource> = {}): StoredResource {
  const resource: KnowledgeResource = {
    id,
    type: "youtube",
    title: `Resource ${id}`,
    creator: null,
    source: "YouTube",
    url: null,
    filePath: null,
    thumbnail: null,
    tags: ["active"],
    status: "active",
    favorite: false,
    completed: false,
    rating: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    metadata: {},
    collections: ["Active"],
    ...overrides
  };
  return { resource, path: `${id}.md`, legacy: false };
}

function index(entries: UnifiedIndexEntry[]): UnifiedKnowledgeIndex {
  return {
    schema_version: 1,
    rebuilt_at: "2026-08-01T12:00:00.000Z",
    entries,
    connector_statuses: [
      { connector: { id: "c", displayName: "YouTubes", role: "resources", windowsPath: "D:/Vault", enabled: true, includePatterns: [], excludePatterns: [], preferredNoteType: "resource", icon: "library", colorToken: "var(--text-muted)" }, available: true, path: "D:/Vault", vaultName: "YouTubes", error: null, lastScanAt: "now", indexedItemCount: entries.length },
      { connector: { id: "offline", displayName: "_Docs", role: "documents", windowsPath: "D:/Docs", enabled: true, includePatterns: [], excludePatterns: [], preferredNoteType: "document", icon: "files", colorToken: "var(--text-muted)" }, available: false, path: null, vaultName: "_Docs", error: "offline", lastScanAt: null, indexedItemCount: 0 }
    ],
    errors: []
  };
}

describe("Knowledge Navigator Home helpers", () => {
  it("keeps active-vault resources visible when a unified index already exists", () => {
    const entries = buildHomeEntries([storedResource("active")], index([entry("external", { role: "documents", type: "pdf" })]));
    expect(entries.map((item) => item.id)).toEqual(["active", "external"]);
  });

  it("suppresses Active vault plus YouTubes duplicates and prefers the active resource", () => {
    const active = storedResource("active-hermes", { metadata: { video_id: "Nc0Atdjg5sE" }, progress: 35 });
    const external = entry("external-hermes", { metadata: { videoId: "Nc0Atdjg5sE" }, progress: 35 });

    expect(buildHomeEntries([active], index([external])).map((item) => item.id)).toEqual(["active-hermes"]);
  });

  it("suppresses duplicate YouTube video IDs", () => {
    const results = suppressHomeDuplicates([
      entry("old", { metadata: { video_id: "97IO4He9PPc" }, updated_at: "2026-07-30T10:00:00.000Z" }),
      entry("new", { metadata: { videoId: "97IO4He9PPc" }, updated_at: "2026-08-01T10:00:00.000Z" })
    ]);

    expect(results.map((item) => item.id)).toEqual(["new"]);
  });

  it("filters Continue Learning to explicit learning signals", () => {
    expect(isContinueLearningEligible(entry("plain", { completed: false, progress: 0 }))).toBe(false);
    expect(isContinueLearningEligible(entry("progress", { progress: 45 }))).toBe(true);
    expect(isContinueLearningEligible(entry("completed", { completed: true, progress: 100 }))).toBe(false);
    expect(isContinueLearningEligible(entry("opened", { progress: 0, metadata: { lastOpened: "2026-08-01T11:00:00.000Z" } }))).toBe(true);
    expect(isContinueLearningEligible(entry("priority", { progress: 0, priority: "high" }))).toBe(true);
  });

  it("ranks Continue Learning deterministically and limits the section", () => {
    const results = continueLearningEntries([
      entry("favorite", { progress: 20, favorite: true, updated_at: "2026-08-01T09:00:00.000Z" }),
      entry("priority", { progress: 20, priority: "high", updated_at: "2026-08-01T09:30:00.000Z" }),
      entry("opened", { progress: 5, metadata: { last_opened: "2026-08-01T12:00:00.000Z" } }),
      entry("more-progress", { progress: 80, updated_at: "2026-08-01T08:00:00.000Z" })
    ], 3);

    expect(results.map((item) => item.id)).toEqual(["opened", "more-progress", "priority"]);
  });

  it("does not duplicate logical entries across Home sections", () => {
    const duplicateA = entry("a", { metadata: { video_id: "Nc0Atdjg5sE" }, tags: ["ai"], collections: ["Hermes"], progress: 10 });
    const duplicateB = entry("b", { metadata: { videoId: "Nc0Atdjg5sE" }, tags: ["ai"], collections: ["Hermes"], progress: 10 });
    const entries = [duplicateA, duplicateB];

    expect(continueLearningEntries(entries).map((item) => item.id)).toHaveLength(1);
    expect(activityTimeline(entries, new Date("2026-08-01T12:00:00.000Z"))[0]?.entries.map((item) => item.id)).toHaveLength(1);
    expect(topTags(entries)).toEqual([{ tag: "ai", count: 1, weight: 5 }]);
    expect(favoriteCollections(entries)).toEqual([{ name: "Hermes", count: 1 }]);
  });

  it("uses last opened before updated date and hides invalid date labels", () => {
    expect(formatDisplayDate(entry("opened", { metadata: { opened_at: "2026-08-01T11:00:00.000Z" }, updated_at: "2026-07-01T10:00:00.000Z" }))).toMatch(/^Last opened /);
    expect(formatDisplayDate(entry("updated", { updated_at: "2026-08-01T10:00:00.000Z" }))).toMatch(/^Updated /);
    expect(formatDisplayDate(entry("invalid", { updated_at: "not-a-date" }))).toBe("");
  });

  it("counts unique logical role items", () => {
    const data = index([
      entry("resource", { metadata: { video_id: "Nc0Atdjg5sE" } }),
      entry("resource-copy", { metadata: { videoId: "Nc0Atdjg5sE" } }),
      entry("conversation", { role: "conversations", connector_name: "Obsidian_Vault", vault_name: "Obsidian_Vault", type: "conversation" }),
      entry("document", { role: "documents", connector_name: "_Docs", vault_name: "_Docs", type: "pdf" }),
      entry("active", { origin: "active-vault", connector_id: "active-vault", connector_name: "Active vault", vault_name: "Active vault", role: "active" })
    ]);

    expect(homeOverviewCounts(suppressHomeDuplicates(data.entries), data)).toMatchObject({ resources: 2, conversations: 1, documents: 1, active: 1, availableConnectors: 1, unavailableConnectors: 1 });
  });

  it("builds the top 20 weighted tag cloud", () => {
    const tags = topTags([
      entry("a", { tags: ["ai", "security"] }),
      entry("b", { tags: ["ai"] }),
      entry("c", { tags: ["network"] })
    ]);

    expect(tags[0]).toMatchObject({ tag: "ai", count: 2, weight: 5 });
    expect(tags).toHaveLength(3);
  });

  it("does not render empty timeline groups for old activity", () => {
    expect(activityTimeline([entry("old", { updated_at: "2026-07-01T10:00:00.000Z" })], new Date("2026-08-01T12:00:00.000Z"))).toEqual([]);
  });

  it("groups recent activity into Today Yesterday and This Week", () => {
    const groups = activityTimeline([
      entry("today", { updated_at: "2026-08-01T10:00:00.000Z" }),
      entry("yesterday", { updated_at: "2026-07-31T10:00:00.000Z" }),
      entry("week", { updated_at: "2026-07-28T10:00:00.000Z" })
    ], new Date("2026-08-01T12:00:00.000Z"));

    expect(groups.map((group) => group.label)).toEqual(["Today", "Yesterday", "This Week"]);
    expect(groups.map((group) => group.entries[0]?.id)).toEqual(["today", "yesterday", "week"]);
  });

  it("derives favorite collections without a storage format change", () => {
    expect(favoriteCollections([
      entry("a", { favorite: true, collections: ["Hermes"] }),
      entry("b", { priority: "high", collections: ["Hermes"] }),
      entry("c", { collections: ["Other"] })
    ])).toEqual([{ name: "Hermes", count: 2 }]);
  });
});

describe("Knowledge Navigator Home source contracts", () => {
  it("declares the Home view, command, and default landing wiring", () => {
    expect(source("src/core/viewTypes.ts")).toContain("KNOWLEDGE_HOME_VIEW_TYPE");
    expect(source("src/main.ts")).toContain("KnowledgeHomeView");
    expect(source("src/main.ts")).toContain("openDefaultLandingView");
    expect(source("src/main.ts")).toContain("await this.openHomeView();");
    expect(source("src/commands/libraryCommands.ts")).toContain("Knowledge Library: Home");
    expect(source("src/ui/RibbonService.ts")).toContain("Open Knowledge Library");
  });

  it("renders required Home sections and empty-state actions", () => {
    const home = source("src/ui/KnowledgeHomeView.ts");
    for (const text of ["Continue Learning", "Recent Activity", "Recent Resources", "Recent Conversations", "Recent Documents", "Favorite Collections", "Most Used Tags", "Search Everything"]) {
      expect(home).toContain(text);
    }
    for (const text of ["Add your first resource", "Connect another vault", "Import resources", "Open documentation"]) {
      expect(home).toContain(text);
    }
  });

  it("opens Universal Search from the large search box on Enter", () => {
    const home = source("src/ui/KnowledgeHomeView.ts");
    expect(home).toContain("Search videos, conversations, documents, notes...");
    expect(home).toContain('event.key === "Enter"');
    expect(home).toContain("openUniversalSearch(input.value.trim())");
    expect(home).toContain('input.type = "search"');
  });

  it("uses the persistent shell for navigation and keeps filtered library hooks", () => {
    const home = source("src/ui/KnowledgeHomeView.ts");
    const library = source("src/ui/KnowledgeLibraryView.ts");
    const shell = source("src/ui/NavigationShell.ts");
    expect(home).toContain("renderKnowledgeNavigation(this.contentEl, this.plugin, \"home\")");
    expect(home).toContain("renderHomeSummary(counts)");
    expect(shell).toContain("navButton(nav, \"Library\"");
    expect(shell).toContain("navButton(nav, \"Topics\"");
    expect(shell).toContain("navButton(nav, \"+ Add Resource\"");
    expect(home).toContain("openTopicPage(collection.name)");
    expect(home).toContain("openTopicPage(tag.tag)");
    expect(library).toContain("setFilters(filters: Partial<LibraryFilters>)");
  });

  it("adds Home settings and responsive no-horizontal-overflow CSS", () => {
    const settings = source("src/ui/KnowledgeLibrarySettingTab.ts");
    const css = source("src/styles.css");
    expect(settings).toContain('"Home"');
    expect(settings).toContain("Show Continue Learning");
    expect(settings).toContain("Show Timeline");
    expect(settings).toContain("Show Tag Cloud");
    expect(settings).toContain("Default startup page");
    expect(css).toContain(".knowledge-library-home-view");
    expect(css).toMatch(/\.knowledge-library-home-view\s*\{[\s\S]*?overflow-x:\s*hidden;[\s\S]*?overflow-y:\s*auto;/);
    expect(css).toContain("@media (max-width: 760px)");
    expect(css).toContain("min-height: 52px");
    expect(css).toContain(".knowledge-library-home-row-action");
    expect(source("src/ui/KnowledgeHomeView.ts")).toContain("No tags yet.");
    expect(source("src/ui/KnowledgeHomeView.ts")).toContain("No recent activity this week.");
  });
});
