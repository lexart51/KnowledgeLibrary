import { ItemView, Notice, WorkspaceLeaf } from "obsidian";
import { KNOWLEDGE_UNIVERSAL_SEARCH_VIEW_TYPE } from "../core/viewTypes";
import KnowledgeLibraryPlugin from "../main";
import { UnifiedIndexEntry, UnifiedKnowledgeIndex } from "../models/VaultConnector";
import { highlightMatchedTerms, SearchRankingService, UniversalSearchDisplayMode, UniversalSearchResult, UniversalSearchSortMode } from "../services/SearchRankingService";
import { serializeSavedSearch } from "../services/SavedSearchService";
import { primaryTopicForEntry, TopicService, TopicSummary } from "../services/TopicService";
import { renderKnowledgeNavigation } from "./NavigationShell";

export class UniversalSearchView extends ItemView {
  private index: UnifiedKnowledgeIndex | null = null;
  private ranking = new SearchRankingService();
  private query = "";
  private displayMode: UniversalSearchDisplayMode;
  private sortMode: UniversalSearchSortMode = "updated";
  private selectedIndex = 0;
  private sequence = 0;
  private searchTimer: number | null = null;
  private inputEl!: HTMLInputElement;
  private resultsEl!: HTMLElement;
  private overviewEl!: HTMLElement;
  private diagnosticsEl!: HTMLElement;
  private currentResults: UniversalSearchResult[] = [];
  private currentTopicResults: TopicSummary[] = [];
  private topicService = new TopicService();

  constructor(leaf: WorkspaceLeaf, private readonly plugin: KnowledgeLibraryPlugin) {
    super(leaf);
    this.displayMode = plugin.settings.defaultSearchDisplayMode;
  }

  getViewType(): string {
    return KNOWLEDGE_UNIVERSAL_SEARCH_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Universal Knowledge Search";
  }

  async onOpen(): Promise<void> {
    this.renderShell();
    this.index = await this.plugin.unifiedIndexService.load() ?? await this.plugin.unifiedIndexService.rebuild();
    this.renderOverview();
    this.runSearch();
    window.setTimeout(() => this.inputEl.focus(), 0);
  }

  setQuery(query: string): void {
    this.query = query;
    if (this.inputEl) this.inputEl.value = query;
    this.scheduleSearch();
  }

  private renderShell(): void {
    this.contentEl.empty();
    this.contentEl.addClass("knowledge-library-universal-search-view");
    renderKnowledgeNavigation(this.contentEl, this.plugin, "search");
    const header = this.contentEl.createDiv({ cls: "knowledge-library-universal-header" });
    header.createEl("h2", { text: "Universal Knowledge Search" });
    const actions = header.createDiv({ cls: "knowledge-library-view-actions" });
    this.button(actions, "Save search", "Save current search", () => void this.saveCurrentSearch());
    this.button(actions, "Saved searches", "Manage saved searches", () => void this.plugin.manageSavedSearches());
    this.button(actions, "Rebuild index", "Rebuild unified index", () => void this.rebuildIndex());

    const toolbar = this.contentEl.createDiv({ cls: "knowledge-library-universal-toolbar" });
    this.inputEl = toolbar.createEl("input", { cls: "knowledge-library-search", attr: { "aria-label": "Search all knowledge", title: "Search all knowledge", placeholder: 'Search, or filter with type:pdf source:Obsidian_Vault tag:security collection:"Retirement Automation"' } });
    this.inputEl.type = "search";
    this.inputEl.addEventListener("input", () => {
      this.query = this.inputEl.value;
      this.scheduleSearch();
    });
    this.inputEl.addEventListener("keydown", (event) => this.handleKeys(event));

    this.select(toolbar, "Display mode", ["compact", "comfortable", "grouped-role", "grouped-vault", "grouped-source"], this.displayMode, (value) => {
      this.displayMode = value as UniversalSearchDisplayMode;
      this.renderResults();
    });
    this.select(toolbar, "Sort", ["relevance", "updated", "added", "title", "source", "vault", "type", "priority", "progress"], this.sortMode, (value) => {
      this.sortMode = value as UniversalSearchSortMode;
      this.runSearch();
    });

    this.overviewEl = this.contentEl.createDiv({ cls: "knowledge-library-ecosystem-overview" });
    this.resultsEl = this.contentEl.createDiv({ cls: "knowledge-library-universal-results", attr: { role: "listbox", "aria-label": "Universal search results" } });
    this.diagnosticsEl = this.contentEl.createDiv({ cls: "knowledge-library-search-diagnostics" });
  }

  private scheduleSearch(): void {
    if (this.searchTimer !== null) window.clearTimeout(this.searchTimer);
    const sequence = ++this.sequence;
    this.searchTimer = window.setTimeout(() => {
      if (sequence === this.sequence) this.runSearch(sequence);
    }, this.plugin.settings.searchDebounceMs);
  }

  private runSearch(sequence = ++this.sequence): void {
    if (!this.index || sequence !== this.sequence) return;
    const start = performance.now();
    this.sortMode = this.query.trim() ? this.sortMode === "updated" ? "relevance" : this.sortMode : this.sortMode;
    this.currentTopicResults = this.plugin.settings.enableTopicPages ? this.topicService.searchTopics(this.index.entries, this.query, 5) : [];
    this.currentResults = this.ranking.search(this.index, this.query, {
      activeVaultBoost: this.plugin.settings.searchActiveVaultBoost,
      favoriteBoost: this.plugin.settings.searchFavoriteBoost,
      recentBoost: this.plugin.settings.searchRecentBoost,
      duplicateSuppression: this.plugin.settings.searchDuplicateSuppression,
      resultLimit: this.plugin.settings.searchResultLimit,
      excerptLength: this.plugin.settings.searchExcerptLength
    }, this.sortMode);
    this.selectedIndex = Math.min(this.selectedIndex, Math.max(0, this.currentResults.length - 1));
    this.renderOverview();
    this.renderResults();
    if (process.env.NODE_ENV !== "production") {
      this.diagnosticsEl.setText(`${this.currentResults.length} results in ${Math.round(performance.now() - start)}ms`);
    }
  }

  private renderOverview(): void {
    if (!this.index || !this.overviewEl) return;
    this.overviewEl.empty();
    const counts = overviewCounts(this.index);
    const metrics = this.overviewEl.createDiv({ cls: "knowledge-library-dashboard-grid" });
    this.metric(metrics, "Resources", counts.resources, "role:resources");
    this.metric(metrics, "Conversations", counts.conversations, "role:conversations");
    this.metric(metrics, "Documents", counts.documents, "role:documents");
    this.metric(metrics, "Active Vault", counts.active, "role:active");
    this.metric(metrics, "Available connectors", counts.available, "");
    this.metric(metrics, "Unavailable connectors", counts.unavailable, "");
    const taxonomy = this.overviewEl.createDiv({ cls: "knowledge-library-overview-taxonomy" });
    taxonomy.createDiv({ text: `Top tags: ${topValues(this.index.entries.flatMap((entry) => entry.tags)).join(", ") || "None"}`, cls: "knowledge-library-card-meta" });
    taxonomy.createDiv({ text: `Top collections: ${topValues(this.index.entries.flatMap((entry) => entry.collections)).join(", ") || "None"}`, cls: "knowledge-library-card-meta" });
  }

  private renderResults(): void {
    this.resultsEl.empty();
    this.resultsEl.removeClasses(["is-compact", "is-comfortable", "is-grouped-role", "is-grouped-vault", "is-grouped-source"]);
    this.resultsEl.addClass(`is-${this.displayMode}`);
    if (!this.index) return;
    if (this.currentResults.length === 0 && this.currentTopicResults.length === 0) {
      const unavailable = this.index.connector_statuses.filter((status) => status.connector.enabled && !status.available);
      this.resultsEl.createDiv({ text: unavailable.length > 0 ? "No matches. Some connectors are unavailable; rebuild after they sync." : "Search across resources, conversations, documents, and active-vault entries.", cls: "knowledge-library-empty-state" });
      return;
    }

    const parsed = this.ranking.parse(this.query);
    if (this.currentTopicResults.length > 0) {
      this.resultsEl.createEl("h3", { text: "Topics" });
      for (const topic of this.currentTopicResults) this.renderTopicResult(topic, parsed.terms);
    }
    if (this.displayMode.startsWith("grouped")) {
      for (const [group, results] of groupResults(this.currentResults, this.displayMode)) {
        this.resultsEl.createEl("h3", { text: group });
        for (const result of results) this.renderResult(result, parsed.terms);
      }
      return;
    }
    for (const result of this.currentResults) this.renderResult(result, parsed.terms);
  }

  private renderTopicResult(topic: TopicSummary, terms: string[]): void {
    const row = this.resultsEl.createDiv({ cls: "knowledge-library-search-result is-topic", attr: { role: "option", tabindex: "0", "aria-label": `Open topic ${topic.name}`, title: `Open topic ${topic.name}` } });
    const title = row.createDiv({ cls: "knowledge-library-result-title" });
    title.innerHTML = `TOPIC ${highlightMatchedTerms(topic.name, terms)}`;
    const badges = row.createDiv({ cls: "knowledge-library-card-badge-row" });
    badges.createSpan({ text: "Topic", cls: "knowledge-library-type-badge" });
    badges.createSpan({ text: `${topic.entries.length} items`, cls: "knowledge-library-source-badge" });
    row.createDiv({ text: `${topic.counts.videos} videos | ${topic.counts.conversations} conversations | ${topic.counts.documents} documents | ${topic.progress}% progress`, cls: "knowledge-library-result-meta" });
    if (topic.description) row.createDiv({ text: topic.description, cls: "knowledge-library-result-excerpt" });
    row.addEventListener("click", () => void this.plugin.openTopicPage(topic.name));
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter") void this.plugin.openTopicPage(topic.name);
    });
  }
  private renderResult(result: UniversalSearchResult, terms: string[]): void {
    const entry = result.entry;
    const row = this.resultsEl.createDiv({ cls: `knowledge-library-search-result is-${entry.role} is-${entry.type}`, attr: { role: "option", "aria-selected": String(this.currentResults[this.selectedIndex] === result), tabindex: "0" } });
    if (this.currentResults[this.selectedIndex] === result) row.addClass("is-selected");
    row.addEventListener("click", () => this.openEntry(entry));
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter") this.openEntry(entry);
    });
    const title = row.createDiv({ cls: "knowledge-library-result-title" });
    title.innerHTML = highlightMatchedTerms(entry.title, terms);
    const badges = row.createDiv({ cls: "knowledge-library-card-badge-row" });
    badges.createSpan({ text: entry.connector_name, cls: "knowledge-library-source-badge" });
    badges.createSpan({ text: entry.vault_name, cls: "knowledge-library-external-badge" });
    badges.createSpan({ text: String(entry.role), cls: "knowledge-library-type-badge" });
    badges.createSpan({ text: entry.type, cls: "knowledge-library-type-badge" });
    if (entry.source_platform) badges.createSpan({ text: entry.source_platform, cls: "knowledge-library-source-badge" });
    row.createDiv({ text: [entry.creator, entry.updated_at, entry.priority, entry.progress !== undefined ? `${entry.progress}%` : null].filter(Boolean).join(" | "), cls: "knowledge-library-result-meta" });
    if (this.plugin.settings.searchShowExcerpts && entry.excerpt) {
      const excerpt = row.createDiv({ cls: "knowledge-library-result-excerpt" });
      excerpt.innerHTML = highlightMatchedTerms(entry.excerpt.slice(0, this.plugin.settings.searchExcerptLength), terms);
    }
    const taxonomy = [...entry.tags.map((tag) => `#${tag}`), ...entry.collections.map((collection) => `[${collection}]`)];
    if (taxonomy.length > 0) row.createDiv({ text: taxonomy.join(" "), cls: "knowledge-library-card-tags" });
    if (result.suppressedDuplicates.length > 0) row.createDiv({ text: `${result.suppressedDuplicates.length} duplicate suppressed`, cls: "knowledge-library-result-meta" });
    const topic = primaryTopicForEntry(entry);
    if (topic && this.plugin.settings.enableTopicPages) {
      const action = row.createEl("button", { text: "Open Topic", cls: "knowledge-library-button", attr: { "aria-label": `Open topic ${topic}`, title: `Open topic ${topic}` } });
      action.addEventListener("click", (event) => {
        event.stopPropagation();
        void this.plugin.openTopicPage(topic);
      });
    }
  }

  private handleKeys(event: KeyboardEvent): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.selectedIndex = Math.min(this.currentResults.length - 1, this.selectedIndex + 1);
      this.renderResults();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.renderResults();
    } else if (event.key === "Enter" && this.currentResults[this.selectedIndex]) {
      event.preventDefault();
      this.openEntry(this.currentResults[this.selectedIndex].entry);
    } else if (event.key === "Escape") {
      if (this.query) {
        this.query = "";
        this.inputEl.value = "";
        this.runSearch();
      } else {
        this.leaf.detach();
      }
    }
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

  private async rebuildIndex(): Promise<void> {
    this.index = await this.plugin.rebuildUnifiedIndex();
    this.runSearch();
  }

  async saveCurrentSearch(): Promise<void> {
    if (!this.plugin.settings.searchEnableSavedSearches) {
      new Notice("Saved searches are disabled in settings.");
      return;
    }
    const name = window.prompt("Saved search name", this.query || "Universal search");
    if (!name) return;
    await this.plugin.savedSearchService.save(serializeSavedSearch(name, this.query, this.displayMode, this.sortMode));
    new Notice("Saved search saved.");
  }

  private metric(parent: HTMLElement, label: string, value: number, query: string): void {
    const metric = parent.createDiv({ cls: "knowledge-library-report-metric" });
    metric.createSpan({ text: label });
    metric.createEl("strong", { text: String(value) });
    if (query) metric.addEventListener("click", () => this.setQuery(query));
  }

  private select(parent: HTMLElement, labelText: string, options: string[], value: string, onChange: (value: string) => void): void {
    const label = parent.createEl("label", { cls: "knowledge-library-control" });
    label.createSpan({ text: labelText });
    const select = label.createEl("select", { attr: { "aria-label": labelText, title: labelText } });
    for (const option of options) select.createEl("option", { text: option, value: option });
    select.value = value;
    select.addEventListener("change", () => onChange(select.value));
  }

  private button(parent: HTMLElement, text: string, ariaLabel: string, onClick: () => void): void {
    const button = parent.createEl("button", { text, cls: "knowledge-library-button", attr: { "aria-label": ariaLabel, title: ariaLabel } });
    button.addEventListener("click", onClick);
  }
}

export function overviewCounts(index: UnifiedKnowledgeIndex): Record<string, number> {
  return {
    resources: index.entries.filter((entry) => entry.role === "resources").length,
    conversations: index.entries.filter((entry) => entry.role === "conversations").length,
    documents: index.entries.filter((entry) => entry.role === "documents").length,
    active: index.entries.filter((entry) => entry.origin === "active-vault").length,
    available: index.connector_statuses.filter((status) => status.connector.enabled && status.available).length,
    unavailable: index.connector_statuses.filter((status) => status.connector.enabled && !status.available).length
  };
}

function groupResults(results: UniversalSearchResult[], mode: UniversalSearchDisplayMode): Array<[string, UniversalSearchResult[]]> {
  const groups = new Map<string, UniversalSearchResult[]>();
  for (const result of results) {
    const key = mode === "grouped-vault" ? result.entry.vault_name : mode === "grouped-source" ? result.entry.connector_name : String(result.entry.role);
    groups.set(key, [...(groups.get(key) ?? []), result]);
  }
  return Array.from(groups.entries()).sort(([left], [right]) => left.localeCompare(right));
}

function topValues(values: string[], limit = 8): string[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Array.from(counts.entries()).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])).slice(0, limit).map(([value]) => value);
}
