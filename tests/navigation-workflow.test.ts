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

import { TopicSummary } from "../src/services/TopicService";
import { formatTopicActivity, topicBrowserOptions } from "../src/ui/KnowledgeTopicsView";

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function topic(name: string, overrides: Partial<TopicSummary> = {}): TopicSummary {
  return {
    id: name.toLowerCase(),
    name,
    description: null,
    aliases: [],
    entries: [],
    counts: { videos: 0, conversations: 0, documents: 0, resources: 0, collections: 0 },
    progress: 0,
    relatedTopics: [],
    timeline: [],
    continueLearning: [],
    updated_at: "2026-08-01T10:00:00.000Z",
    ...overrides
  };
}

describe("KnowledgeLibrary navigation workflow", () => {
  it("renders one persistent shell with all major sections and active state", () => {
    const shell = source("src/ui/NavigationShell.ts");
    for (const label of ["Home", "Search", "Library", "Topics", "Collections", "Dashboard", "+ Add Resource", "Settings"]) {
      expect(shell).toContain(`navButton(nav, "${label}"`);
    }
    expect(shell).toContain("aria-current");
    expect(shell).toContain("is-active");
    expect(shell).toContain("mod-cta");
  });

  it("switches views from shell navigation without relying on command palette", () => {
    const shell = source("src/ui/NavigationShell.ts");
    expect(shell).toContain("plugin.openHomeView()");
    expect(shell).toContain("plugin.openUniversalSearch()");
    expect(shell).toContain("plugin.openLibraryView()");
    expect(shell).toContain("plugin.openTopicsView()");
    expect(shell).toContain("plugin.openCollectionsManager()");
    expect(shell).toContain("plugin.openDashboardView()");
    expect(shell).toContain("plugin.openAddResourceModal()");
    expect(shell).toContain("plugin.openSettings()");
  });

  it("opens Home as the normal startup entry point", () => {
    const main = source("src/main.ts");
    expect(main).toContain("async openDefaultLandingView(): Promise<void> {");
    expect(main).toContain("await this.openHomeView();");
    expect(source("src/ui/RibbonService.ts")).toContain("Open Knowledge Library");
  });

  it("makes Topics a browser view with alphabetical results and topic metrics", () => {
    const results = topicBrowserOptions([topic("WireGuard"), topic("Hermes"), topic("Claude")], "", 10);
    expect(results.map((item) => item.topic.name)).toEqual(["Claude", "Hermes", "WireGuard"]);
    const view = source("src/ui/KnowledgeTopicsView.ts");
    expect(view).toContain("Knowledge Library: Topics");
    expect(view).toContain("Search topics...");
    expect(view).toContain("resources | ${option.topic.counts.conversations} conversations");
    expect(view).toContain("this.plugin.openTopicPage(option.topic.name)");
  });

  it("keeps Dashboard workflow-first and moves statistics below actions", () => {
    const dashboard = source("src/ui/KnowledgeDashboardView.ts");
    expect(dashboard).toContain("What should I do now?");
    expect(dashboard).toContain("renderWorkflow(entries)");
    expect(dashboard).toContain("Continue Learning");
    expect(dashboard).toContain("Recent Topics");
    expect(dashboard).toContain("Recent Activity");
    expect(dashboard).toContain("Quick Actions");
    expect(dashboard.indexOf("renderWorkflow(entries)")).toBeLessThan(dashboard.indexOf("Statistics"));
  });

  it("keeps quick Add Resource visible everywhere through the shell", () => {
    const shell = source("src/ui/NavigationShell.ts");
    const css = source("src/styles.css");
    expect(shell).toContain("+ Add Resource");
    expect(shell).toContain("plugin.openAddResourceModal()");
    expect(css).toContain(".knowledge-library-shell-nav-button.mod-cta");
  });

  it("renders shell in the major workflow surfaces", () => {
    expect(source("src/ui/KnowledgeHomeView.ts")).toContain("renderKnowledgeNavigation(this.contentEl, this.plugin, \"home\")");
    expect(source("src/ui/KnowledgeLibraryView.ts")).toContain("renderKnowledgeNavigation(this.contentEl, this.plugin, \"library\")");
    expect(source("src/ui/KnowledgeTopicsView.ts")).toContain("renderKnowledgeNavigation(this.contentEl, this.plugin, \"topics\")");
    expect(source("src/ui/KnowledgeDashboardView.ts")).toContain("renderKnowledgeNavigation(this.contentEl, this.plugin, \"dashboard\")");
    expect(source("src/ui/UniversalSearchView.ts")).toContain("renderKnowledgeNavigation(this.contentEl, this.plugin, \"search\")");
    expect(source("src/ui/KnowledgeLibrarySettingTab.ts")).toContain("renderKnowledgeNavigation(containerEl, this.plugin, \"settings\")");
  });

  it("uses a responsive non-horizontal navigation shell", () => {
    const css = source("src/styles.css");
    expect(css).toMatch(/\.knowledge-library-shell-nav\s*\{[\s\S]*?position:\s*sticky;/);
    expect(css).toContain("flex-wrap: wrap");
    expect(css).toContain("overflow-x: hidden;");
  });

  it("formats missing topic activity without misleading dates", () => {
    expect(formatTopicActivity(topic("No Date", { updated_at: null }))).toBe("none");
    expect(formatTopicActivity(topic("Bad Date", { updated_at: "not-a-date" }))).toBe("none");
  });
});
