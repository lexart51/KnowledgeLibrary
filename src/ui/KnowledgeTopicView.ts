import { ItemView, Notice, WorkspaceLeaf } from "obsidian";
import { KNOWLEDGE_TOPIC_VIEW_TYPE } from "../core/viewTypes";
import KnowledgeLibraryPlugin from "../main";
import { UnifiedIndexEntry, UnifiedKnowledgeIndex, VaultConnectorRole } from "../models/VaultConnector";
import { TopicService, TopicSummary, TopicTimelineItem } from "../services/TopicService";
import { buildHomeEntries } from "./KnowledgeHomeView";

export interface TopicPageModel {
  topic: TopicSummary | null;
  entries: UnifiedIndexEntry[];
  overview: {
    recentResources: UnifiedIndexEntry[];
    importantResources: UnifiedIndexEntry[];
    mostViewed: UnifiedIndexEntry[];
    recentConversations: UnifiedIndexEntry[];
    recentDocuments: UnifiedIndexEntry[];
  };
}

export class KnowledgeTopicView extends ItemView {
  private topicName = "";
  private readonly topicService = new TopicService();

  constructor(leaf: WorkspaceLeaf, private readonly plugin: KnowledgeLibraryPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return KNOWLEDGE_TOPIC_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.topicName ? `Knowledge Topic: ${this.topicName}` : "Knowledge Topic";
  }

  async onOpen(): Promise<void> {
    await this.refresh();
  }

  async setTopic(topicName: string): Promise<void> {
    this.topicName = topicName;
    await this.refresh();
  }

  async refresh(): Promise<void> {
    try {
      const resources = await this.plugin.resourceRepository.list();
      const index = await this.plugin.unifiedIndexService.load();
      const entries = buildHomeEntries(resources, index);
      const model = buildTopicPageModel(entries, this.topicName, this.topicService);
      this.render(model, index);
    } catch (error) {
      new Notice(error instanceof Error ? error.message : "Unable to load topic.");
    }
  }

  private render(model: TopicPageModel, index: UnifiedKnowledgeIndex | null): void {
    this.contentEl.empty();
    this.contentEl.addClass("knowledge-library-topic-view");
    if (!this.plugin.settings.enableTopicPages) {
      this.contentEl.createDiv({ text: "Topic Pages are disabled in settings.", cls: "knowledge-library-empty-state" });
      return;
    }
    if (!model.topic) {
      this.renderTopicPicker(model.entries);
      return;
    }

    const topic = model.topic;
    const header = this.contentEl.createDiv({ cls: "knowledge-library-topic-header" });
    header.createDiv({ text: topic.icon, cls: "knowledge-library-topic-icon" });
    const title = header.createDiv({ cls: "knowledge-library-topic-title" });
    title.createEl("h2", { text: topic.name });
    if (topic.description) title.createDiv({ text: topic.description, cls: "knowledge-library-result-excerpt" });
    title.createDiv({ text: `${topic.entries.length} logical items from ${index?.connector_statuses.filter((status) => status.available).length ?? 0} available connector(s)`, cls: "knowledge-library-result-meta" });

    const stats = this.contentEl.createDiv({ cls: "knowledge-library-topic-stats" });
    this.metric(stats, "Videos", topic.counts.videos, () => this.openTopicSearch(`${topic.name} type:youtube`));
    this.metric(stats, "Conversations", topic.counts.conversations, () => this.openTopicSearch(`${topic.name} role:conversations`));
    this.metric(stats, "Documents", topic.counts.documents, () => this.openTopicSearch(`${topic.name} role:documents`));
    this.metric(stats, "Resources", topic.counts.resources, () => this.openTopicSearch(`${topic.name} role:resources`));
    this.metric(stats, "Collections", topic.counts.collections, () => void this.plugin.openLibraryView({ collection: topic.name }));
    this.metric(stats, "Progress", topic.progress, () => this.openTopicSearch(`${topic.name} progress:in-progress`), "%");

    this.renderOverview(model);
    this.renderEntrySection("Resources", byRole(topic.entries, "resources"), "Open");
    this.renderEntrySection("Conversations", byRole(topic.entries, "conversations"), "Open");
    this.renderEntrySection("Documents", byRole(topic.entries, "documents"), "Open");
    this.renderCollections(topic);
    this.renderTimeline(topic.timeline);
    this.renderRelatedTopics(topic);
    this.renderEntrySection("Recent Activity", recent(topic.entries, this.plugin.settings.topicTimelineLength), "Open");
    this.renderEntrySection("Continue Learning", topic.continueLearning, "Continue");
  }

  private renderTopicPicker(entries: UnifiedIndexEntry[]): void {
    this.contentEl.createEl("h2", { text: "Knowledge Topic" });
    const topics = this.topicService.discoverTopics(entries, this.plugin.settings.defaultTopicSort, 24);
    if (topics.length === 0) {
      this.contentEl.createDiv({ text: "No topics discovered yet.", cls: "knowledge-library-empty-state" });
      return;
    }
    const grid = this.contentEl.createDiv({ cls: "knowledge-library-topic-grid" });
    for (const topic of topics) this.topicButton(grid, topic.name, `${topic.entries.length} items`);
  }

  private renderOverview(model: TopicPageModel): void {
    const section = this.section("Overview");
    this.renderInlineGroup(section, "Recent resources", model.overview.recentResources);
    this.renderInlineGroup(section, "Most important", model.overview.importantResources);
    this.renderInlineGroup(section, "Most viewed", model.overview.mostViewed);
    this.renderInlineGroup(section, "Recent conversations", model.overview.recentConversations);
    this.renderInlineGroup(section, "Recent documents", model.overview.recentDocuments);
  }

  private renderInlineGroup(parent: HTMLElement, label: string, entries: UnifiedIndexEntry[]): void {
    const group = parent.createDiv({ cls: "knowledge-library-topic-inline-group" });
    group.createEl("h4", { text: label });
    for (const entry of entries.slice(0, 3)) this.entryButton(group, entry, "Open");
  }

  private renderEntrySection(title: string, entries: UnifiedIndexEntry[], action: string): void {
    const section = this.section(title);
    if (entries.length === 0) {
      section.createDiv({ text: "No matching items.", cls: "knowledge-library-empty-state" });
      return;
    }
    for (const entry of entries.slice(0, 12)) this.entryButton(section, entry, action);
  }

  private renderCollections(topic: TopicSummary): void {
    const section = this.section("Collections");
    const collections = Array.from(new Set(topic.entries.flatMap((entry) => entry.collections))).sort();
    if (collections.length === 0) {
      section.createDiv({ text: "No collections.", cls: "knowledge-library-empty-state" });
      return;
    }
    const row = section.createDiv({ cls: "knowledge-library-home-chip-row" });
    for (const collection of collections) this.topicButton(row, collection, "Collection");
  }

  private renderTimeline(items: TopicTimelineItem[]): void {
    const section = this.section("Timeline");
    if (items.length === 0) {
      section.createDiv({ text: "No timeline activity.", cls: "knowledge-library-empty-state" });
      return;
    }
    for (const item of items.slice(0, this.plugin.settings.topicTimelineLength)) {
      const row = section.createEl("button", { cls: "knowledge-library-topic-timeline-row", attr: { "aria-label": `Open ${item.entry.title}`, title: item.entry.title } });
      row.createSpan({ text: new Date(item.date).toLocaleDateString(), cls: "knowledge-library-result-meta" });
      row.createSpan({ text: item.label, cls: "knowledge-library-type-badge" });
      row.createSpan({ text: item.entry.title, cls: "knowledge-library-result-title" });
      row.addEventListener("click", () => this.openEntry(item.entry));
    }
  }

  private renderRelatedTopics(topic: TopicSummary): void {
    const section = this.section("Related Topics");
    if (topic.relatedTopics.length === 0) {
      section.createDiv({ text: "No related topics yet.", cls: "knowledge-library-empty-state" });
      return;
    }
    const row = section.createDiv({ cls: "knowledge-library-home-chip-row" });
    for (const related of topic.relatedTopics.slice(0, this.plugin.settings.relatedTopicsDepth)) {
      this.topicButton(row, related.topic, `${related.count} shared`);
    }
  }

  private metric(parent: HTMLElement, label: string, value: number, onClick: () => void, suffix = ""): void {
    const button = parent.createEl("button", { cls: "knowledge-library-report-metric", attr: { "aria-label": `${label} ${value}${suffix}`, title: `${label} ${value}${suffix}` } });
    button.createSpan({ text: label });
    button.createEl("strong", { text: `${value}${suffix}` });
    button.addEventListener("click", onClick);
  }

  private section(title: string): HTMLElement {
    const section = this.contentEl.createDiv({ cls: "knowledge-library-topic-section" });
    section.createEl("h3", { text: title });
    return section;
  }

  private topicButton(parent: HTMLElement, topic: string, meta: string): void {
    const button = parent.createEl("button", { cls: "knowledge-library-home-chip", attr: { "aria-label": `Open topic ${topic}`, title: `Open topic ${topic}` } });
    button.createSpan({ text: topic });
    button.createSpan({ text: meta, cls: "knowledge-library-result-meta" });
    button.addEventListener("click", () => void this.plugin.openTopicPage(topic));
  }

  private entryButton(parent: HTMLElement, entry: UnifiedIndexEntry, action: string): void {
    const button = parent.createEl("button", { cls: `knowledge-library-topic-entry is-${entry.role}`, attr: { "aria-label": `${action} ${entry.title}`, title: `${action} ${entry.title}` } });
    button.createSpan({ text: entry.title, cls: "knowledge-library-result-title" });
    button.createSpan({ text: [entry.connector_name, entry.role, entry.type].filter(Boolean).join(" | "), cls: "knowledge-library-result-meta" });
    button.addEventListener("click", () => this.openEntry(entry));
  }

  private openTopicSearch(query: string): void {
    void this.plugin.openUniversalSearch(query);
  }

  private openEntry(entry: UnifiedIndexEntry): void {
    if (entry.origin === "active-vault") {
      void this.plugin.openResourceNote(entry.path);
      return;
    }
    if (entry.open_uri.startsWith("obsidian://")) {
      window.open(entry.open_uri, "_blank");
      return;
    }
    new Notice(entry.open_uri || entry.path);
  }
}

export function buildTopicPageModel(entries: UnifiedIndexEntry[], topicName: string, topicService = new TopicService()): TopicPageModel {
  const topic = topicName ? topicService.findTopic(entries, topicName) : null;
  const topicEntries = topic?.entries ?? [];
  return {
    topic,
    entries,
    overview: {
      recentResources: recent(byRole(topicEntries, "resources"), 5),
      importantResources: important(topicEntries, 5),
      mostViewed: mostViewed(topicEntries, 5),
      recentConversations: recent(byRole(topicEntries, "conversations"), 5),
      recentDocuments: recent(byRole(topicEntries, "documents"), 5)
    }
  };
}

function byRole(entries: UnifiedIndexEntry[], role: VaultConnectorRole): UnifiedIndexEntry[] {
  return entries.filter((entry) => entry.role === role || role === "resources" && entry.role === "active");
}

function recent(entries: UnifiedIndexEntry[], limit: number): UnifiedIndexEntry[] {
  return [...entries].sort((left, right) => activityDate(right).localeCompare(activityDate(left)) || left.title.localeCompare(right.title)).slice(0, limit);
}

function important(entries: UnifiedIndexEntry[], limit: number): UnifiedIndexEntry[] {
  return [...entries].sort((left, right) => Number(Boolean(right.favorite)) - Number(Boolean(left.favorite)) || Number(right.priority === "high") - Number(left.priority === "high") || (right.progress ?? 0) - (left.progress ?? 0) || activityDate(right).localeCompare(activityDate(left))).slice(0, limit);
}

function mostViewed(entries: UnifiedIndexEntry[], limit: number): UnifiedIndexEntry[] {
  return [...entries].sort((left, right) => viewCount(right) - viewCount(left) || activityDate(right).localeCompare(activityDate(left))).slice(0, limit);
}

function viewCount(entry: UnifiedIndexEntry): number {
  const value = entry.metadata.view_count ?? entry.metadata.views ?? entry.metadata.open_count;
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function activityDate(entry: UnifiedIndexEntry): string {
  const opened = typeof entry.metadata.lastOpened === "string" ? entry.metadata.lastOpened : typeof entry.metadata.last_opened === "string" ? entry.metadata.last_opened : null;
  return opened ?? entry.updated_at ?? entry.created_at ?? "";
}
