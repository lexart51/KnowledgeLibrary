import { ItemView, Notice, WorkspaceLeaf } from "obsidian";
import { KNOWLEDGE_TOPICS_VIEW_TYPE } from "../core/viewTypes";
import KnowledgeLibraryPlugin from "../main";
import { TopicService, TopicSummary, topicId } from "../services/TopicService";
import { describeTopicSources, filterTopicPickerOptions, nextTopicPickerIndex } from "./TopicPickerModal";
import { renderKnowledgeNavigation } from "./NavigationShell";

export class KnowledgeTopicsView extends ItemView {
  private readonly topicService = new TopicService();
  private topics: TopicSummary[] = [];
  private query = "";
  private selectedIndex = 0;
  private inputEl!: HTMLInputElement;
  private resultsEl!: HTMLElement;

  constructor(leaf: WorkspaceLeaf, private readonly plugin: KnowledgeLibraryPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return KNOWLEDGE_TOPICS_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Knowledge Library: Topics";
  }

  async onOpen(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    try {
      this.plugin.logger.debug("Topic navigation: Topics ItemView discovery started");
      this.topics = this.topicService.discoverTopics(await this.plugin.loadTopicEntries(), this.plugin.settings.defaultTopicSort, 1000);
      this.plugin.logger.debug("Topic navigation: Topics ItemView topic count", { count: this.topics.length });
      this.render();
    } catch (error) {
      this.plugin.logger.error("Topic navigation: Topics ItemView failed", error);
      new Notice(error instanceof Error ? `Topic discovery failed: ${error.message}` : "Topic discovery failed.");
    }
  }

  private render(): void {
    this.contentEl.empty();
    this.contentEl.addClass("knowledge-library-topics-view");
    renderKnowledgeNavigation(this.contentEl, this.plugin, "topics");

    const header = this.contentEl.createDiv({ cls: "knowledge-library-universal-header" });
    header.createEl("h2", { text: "Knowledge Library: Topics" });
    const actions = header.createDiv({ cls: "knowledge-library-view-actions" });
    actions.createEl("button", { text: "Quick picker", cls: "knowledge-library-button", attr: { "aria-label": "Open quick topic picker", title: "Open quick topic picker" } }).addEventListener("click", () => void this.plugin.openTopicPicker({ fallbackToTopicsView: false }));
    actions.createEl("button", { text: "Refresh", cls: "knowledge-library-button", attr: { "aria-label": "Refresh topics", title: "Refresh topics" } }).addEventListener("click", () => void this.refresh());

    this.inputEl = this.contentEl.createEl("input", { cls: "knowledge-library-topic-picker-search", attr: { "aria-label": "Search topics", title: "Search topics", placeholder: "Search topics..." } });
    this.inputEl.type = "search";
    this.inputEl.value = this.query;
    this.inputEl.addEventListener("input", () => {
      this.query = this.inputEl.value;
      this.selectedIndex = 0;
      this.renderResults();
    });
    this.inputEl.addEventListener("keydown", (event) => this.handleKeydown(event));
    this.resultsEl = this.contentEl.createDiv({ cls: "knowledge-library-topics-results" });
    this.renderResults();
    window.setTimeout(() => this.inputEl.focus(), 0);
  }

  private handleKeydown(event: KeyboardEvent): void {
    const results = filterTopicPickerOptions(this.topics, this.query, 200);
    if (event.key === "Escape") {
      event.preventDefault();
      this.inputEl.value = "";
      this.query = "";
      this.selectedIndex = 0;
      this.renderResults();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.selectedIndex = nextTopicPickerIndex(this.selectedIndex, 1, results.length);
      this.renderResults();
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      this.selectedIndex = nextTopicPickerIndex(this.selectedIndex, -1, results.length);
      this.renderResults();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const selected = results[this.selectedIndex];
      if (!selected) {
        new Notice("No matching topic found.");
        return;
      }
      void this.plugin.openTopicPage(selected.topic.name);
    }
  }

  private renderResults(): void {
    this.resultsEl.empty();
    if (this.topics.length === 0) {
      this.resultsEl.createDiv({ text: "No topics are currently available.", cls: "knowledge-library-empty-state" });
      return;
    }
    const results = filterTopicPickerOptions(this.topics, this.query, 200);
    if (results.length === 0) {
      this.resultsEl.createDiv({ text: "No matching topic found.", cls: "knowledge-library-empty-state" });
      return;
    }
    this.selectedIndex = Math.min(this.selectedIndex, results.length - 1);
    results.forEach((option, index) => {
      const row = this.resultsEl.createEl("button", {
        cls: `knowledge-library-topic-picker-row${index === this.selectedIndex ? " is-selected" : ""}`,
        attr: { "aria-label": `Open topic ${option.topic.name}`, title: `Open topic ${option.topic.name}` }
      });
      row.createSpan({ text: option.topic.name, cls: "knowledge-library-result-title" });
      row.createSpan({ text: `${option.topic.entries.length} logical item${option.topic.entries.length === 1 ? "" : "s"} | ${describeTopicSources(option.topic)}`, cls: "knowledge-library-result-meta" });
      row.addEventListener("click", () => void this.plugin.openTopicPage(option.topic.name));
      row.addEventListener("mousemove", () => {
        this.selectedIndex = index;
      });
    });
  }
}

export function topicMatchesQuery(topic: TopicSummary, query: string): boolean {
  const normalized = topicId(query);
  const text = query.trim().toLowerCase();
  if (!normalized && !text) return true;
  return topicId(topic.name).includes(normalized) || topic.aliases.some((alias) => topicId(alias).includes(normalized) || alias.toLowerCase().includes(text));
}