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

import { UnifiedIndexEntry } from "../src/models/VaultConnector";
import { TopicService, discoverTopicCandidates, primaryTopicForEntry, topicId, topicTimeline } from "../src/services/TopicService";
import { buildTopicPageModel } from "../src/ui/KnowledgeTopicView";
import { popularTopics } from "../src/ui/KnowledgeHomeView";

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

describe("Topic discovery and pages", () => {
  it("discovers topics from tags collections titles aliases and relationships", () => {
    const item = entry("a", {
      title: "WireGuard RouterOS Guide",
      tags: ["mikrotik"],
      collections: ["Network Lab"],
      metadata: { aliases: ["WG"], related_resources: [{ resource_id: "Claude MCP", relationship_type: "related", note: "OpenRouter Agents" }] }
    });

    expect(discoverTopicCandidates(item)).toEqual(expect.arrayContaining(["Mikrotik", "Network Lab", "WireGuard", "RouterOS", "WG", "OpenRouter", "Agents"]));
  });

  it("normalizes duplicate topic names", () => {
    expect(topicId("open_router")).toBe("open-router");
    expect(topicId("Open Router")).toBe("open-router");
  });

  it("builds related topics from co-occurring metadata only", () => {
    const topics = new TopicService().discoverTopics([
      entry("hermes-video", { role: "resources", type: "youtube", tags: ["hermes", "openrouter", "claude"] }),
      entry("hermes-chat", { tags: ["Hermes", "MCP", "Agents"] }),
      entry("other", { tags: ["diabetes"] })
    ]);
    const hermes = topics.find((topic) => topic.id === "hermes");

    expect(hermes?.relatedTopics.map((topic) => topic.topic)).toEqual(expect.arrayContaining(["Openrouter", "Claude", "MCP", "Agents"]));
  });

  it("creates a chronological topic timeline", () => {
    const timeline = topicTimeline([
      entry("old", { updated_at: "2026-07-01T10:00:00.000Z", role: "documents", type: "pdf" }),
      entry("new", { updated_at: "2026-08-01T10:00:00.000Z", role: "resources", type: "youtube" })
    ], 2);

    expect(timeline.map((item) => item.entry.id)).toEqual(["new", "old"]);
    expect(timeline[0].label).toBe("Video added");
  });

  it("suppresses duplicate topic entries by shared YouTube video id", () => {
    const topic = new TopicService().findTopic([
      entry("active", { origin: "active-vault", connector_id: "active-vault", connector_name: "Active vault", vault_name: "Active vault", role: "active", type: "youtube", metadata: { resourceId: "local", video_id: "Nc0Atdjg5sE" }, progress: 20 }),
      entry("external", { role: "resources", type: "youtube", metadata: { videoId: "Nc0Atdjg5sE" }, progress: 20 })
    ], "Hermes");

    expect(topic?.entries.map((item) => item.id)).toEqual(["active"]);
  });

  it("builds topic-scoped Continue Learning only for eligible unfinished items", () => {
    const topic = new TopicService().findTopic([
      entry("zero", { progress: 0 }),
      entry("partial", { progress: 45 }),
      entry("complete", { progress: 100, completed: true }),
      entry("priority", { progress: 0, priority: "high" })
    ], "Hermes");

    expect(topic?.continueLearning.map((item) => item.id)).toEqual(["partial", "priority"]);
  });

  it("builds Topic Page overview buckets", () => {
    const model = buildTopicPageModel([
      entry("resource", { role: "resources", type: "youtube", favorite: true }),
      entry("conversation", { role: "conversations", type: "conversation" }),
      entry("document", { role: "documents", type: "pdf" })
    ], "Hermes");

    expect(model.topic?.name).toBe("Hermes");
    expect(model.overview.recentResources[0]?.id).toBe("resource");
    expect(model.overview.recentConversations[0]?.id).toBe("conversation");
    expect(model.overview.recentDocuments[0]?.id).toBe("document");
  });

  it("searches topics and Home exposes popular topics", () => {
    const entries = [
      entry("hermes", { tags: ["hermes", "claude"] }),
      entry("mikrotik", { tags: ["mikrotik"] })
    ];

    expect(new TopicService().searchTopics(entries, "hermes")[0]?.name).toBe("Hermes");
    expect(popularTopics(entries).map((topic) => topic.name)).toContain("Hermes");
  });

  it("infers a primary topic for navigation", () => {
    expect(primaryTopicForEntry(entry("x", { tags: ["python"] }))).toBe("Python");
  });
});

describe("Topic UI integration contracts", () => {
  it("registers Topic Page view and command", () => {
    expect(source("src/core/viewTypes.ts")).toContain("KNOWLEDGE_TOPIC_VIEW_TYPE");
    expect(source("src/main.ts")).toContain("KnowledgeTopicView");
    expect(source("src/main.ts")).toContain("openTopicPage");
    expect(source("src/commands/libraryCommands.ts")).toContain("Knowledge Library: Open topic page");
  });

  it("integrates topics into Universal Search Library and Home", () => {
    expect(source("src/ui/UniversalSearchView.ts")).toContain("renderTopicResult");
    expect(source("src/ui/UniversalSearchView.ts")).toContain("TOPIC");
    expect(source("src/ui/KnowledgeLibraryView.ts")).toContain("Open Topic");
    expect(source("src/ui/KnowledgeHomeView.ts")).toContain("Popular Topics");
  });

  it("adds Topic settings without storage-format changes", () => {
    const settings = source("src/ui/KnowledgeLibrarySettingTab.ts");
    expect(settings).toContain('"Topics"');
    expect(settings).toContain("Enable Topic Pages");
    expect(settings).toContain("Default Topic Sort");
    expect(settings).toContain("Related Topics depth");
    expect(settings).toContain("Timeline length");
  });
});
