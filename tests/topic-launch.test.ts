import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

vi.mock("obsidian", () => ({
  normalizePath: (path: string) => path.replace(/\\/g, "/").replace(/\/+/g, "/"),
  ItemView: class ItemView {
    async setState(_state: unknown, _result: unknown): Promise<void> {}
  },
  Modal: class Modal {
    contentEl = { empty: vi.fn(), addClass: vi.fn(), createEl: vi.fn(), createDiv: vi.fn() };
    modalEl = { addClass: vi.fn() };
    constructor(_app?: unknown) {}
    open(): void {}
    close(): void {}
  },
  Notice: class Notice { constructor(_message: string) {} },
  Plugin: class Plugin {},
  PluginSettingTab: class PluginSettingTab {},
  Setting: class Setting {},
  TFile: class TFile {},
  WorkspaceLeaf: class WorkspaceLeaf {},
  requestUrl: vi.fn()
}));

import { UnifiedIndexEntry } from "../src/models/VaultConnector";
import { TopicService } from "../src/services/TopicService";
import { describeTopicSources, filterTopicPickerOptions, nextTopicPickerIndex } from "../src/ui/TopicPickerModal";

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function entry(id: string, overrides: Partial<UnifiedIndexEntry> = {}): UnifiedIndexEntry {
  return {
    id,
    origin: "external",
    connector_id: "obsidian",
    connector_name: "Obsidian_Vault",
    vault_name: "Obsidian_Vault",
    role: "conversations",
    type: "conversation",
    title: `Hermes ${id}`,
    creator: null,
    path: `ChatGPT/${id}.md`,
    url: null,
    open_uri: "obsidian://open",
    tags: ["hermes"],
    collections: [],
    excerpt: "Hermes and Claude notes",
    created_at: "2026-08-01T09:00:00.000Z",
    updated_at: "2026-08-01T10:00:00.000Z",
    metadata: {},
    ...overrides
  };
}

describe("Topic Page launch hotfix", () => {
  it("command opens the topic picker instead of a browser prompt", () => {
    const commands = source("src/commands/libraryCommands.ts");
    expect(commands).toContain("openTopicPicker()");
    expect(commands).not.toContain("window.prompt(\"Topic to open\"");
  });

  it("topic picker filters by topic name and aliases case-insensitively", () => {
    const hermes = new TopicService().findTopic([
      entry("a", { tags: ["Hermes"], metadata: { aliases: ["HERMES Agent"] } }),
      entry("b", { tags: ["MikroTik"] })
    ], "hermes");
    const mikrotik = new TopicService().findTopic([entry("b", { tags: ["MikroTik"] })], "mikrotik");

    const results = filterTopicPickerOptions([hermes!, mikrotik!], "agent");
    expect(results.map((item) => item.label)).toEqual(["Hermes"]);
  });

  it("topic picker keyboard selection wraps deterministically", () => {
    expect(nextTopicPickerIndex(0, 1, 3)).toBe(1);
    expect(nextTopicPickerIndex(0, -1, 3)).toBe(2);
    expect(nextTopicPickerIndex(2, 1, 3)).toBe(0);
    expect(nextTopicPickerIndex(0, 1, 0)).toBe(0);
  });

  it("topic picker displays logical count and represented source types", () => {
    const topic = new TopicService().findTopic([
      entry("video", { role: "resources", type: "youtube" }),
      entry("chat", { role: "conversations", type: "conversation" }),
      entry("doc", { role: "documents", type: "pdf" })
    ], "Hermes");

    expect(describeTopicSources(topic!)).toContain("1 video");
    expect(describeTopicSources(topic!)).toContain("1 conversation");
    expect(describeTopicSources(topic!)).toContain("1 document");
  });

  it("openTopicPage validates topics and never silently fails", () => {
    const main = source("src/main.ts");
    expect(main).toContain("async openTopicPicker()");
    expect(main).toContain("No topics are currently available.");
    expect(main).toContain("Topic not found:");
    expect(main).toContain("Knowledge Topic view did not initialize.");
  });

  it("selecting a topic opens and reuses the Knowledge Topic ItemView", () => {
    const main = source("src/main.ts");
    expect(main).toContain("getLeavesOfType(KNOWLEDGE_TOPIC_VIEW_TYPE)[0]");
    expect(main).toContain("setViewState({ type: KNOWLEDGE_TOPIC_VIEW_TYPE, active: true, state: { topicName: topic.name } })");
    expect(main).toContain("await view.setTopic(topic.name)");
  });

  it("topic state reaches and restores inside the ItemView", () => {
    const view = source("src/ui/KnowledgeTopicView.ts");
    expect(view).toContain("getState(): Record<string, unknown>");
    expect(view).toContain("topicName: this.topicName");
    expect(view).toContain("async setState(state: unknown, result: ViewStateResult)");
    expect(view).toContain("this.topicName = typeof state === \"object\"");
  });

  it("existing direct entry points use the shared Topic Page implementation", () => {
    expect(source("src/ui/KnowledgeHomeView.ts")).toContain("openTopicPage(topic.name)");
    expect(source("src/ui/KnowledgeHomeView.ts")).toContain("openTopicPage(collection.name)");
    expect(source("src/ui/KnowledgeHomeView.ts")).toContain("openTopicPage(tag.tag)");
    expect(source("src/ui/UniversalSearchView.ts")).toContain("openTopicPage(topic.name)");
    expect(source("src/ui/KnowledgeLibraryView.ts")).toContain("openTopicPage(collection)");
    expect(source("src/ui/KnowledgeLibraryView.ts")).toContain("openTopicPage(topic)");
    expect(source("src/ui/KnowledgeTopicView.ts")).toContain("openTopicPage(topic)");
  });

  it("dashboard source remains untouched by the hotfix", () => {
    const dashboard = source("src/ui/KnowledgeDashboardView.ts");
    expect(dashboard).toContain("Total resources");
    expect(dashboard).toContain("connector_statuses");
  });
});