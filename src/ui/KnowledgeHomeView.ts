import { ItemView, Notice, WorkspaceLeaf } from "obsidian";
import { KNOWLEDGE_HOME_VIEW_TYPE } from "../core/viewTypes";
import KnowledgeLibraryPlugin from "../main";
import { UnifiedIndexEntry, UnifiedKnowledgeIndex, VaultConnectorRole } from "../models/VaultConnector";
import { duplicateKeys } from "../services/SearchRankingService";
import { TopicService, TopicSummary } from "../services/TopicService";
import { StoredResource } from "../services/VaultResourceRepository";
import { renderKnowledgeNavigation } from "./NavigationShell";

export interface HomeOverviewCounts {
  resources: number;
  conversations: number;
  documents: number;
  active: number;
  availableConnectors: number;
  unavailableConnectors: number;
}

export interface HomeTimelineGroup {
  label: "Today" | "Yesterday" | "This Week";
  entries: UnifiedIndexEntry[];
}

export interface HomeTagCloudItem {
  tag: string;
  count: number;
  weight: number;
}

export class KnowledgeHomeView extends ItemView {
  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: KnowledgeLibraryPlugin
  ) {
    super(leaf);
  }

  getViewType(): string {
    return KNOWLEDGE_HOME_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Knowledge Library: Home";
  }

  async onOpen(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    try {
      const resources = await this.plugin.resourceRepository.list();
      const index = await this.plugin.unifiedIndexService.load();
      this.render(resources, index);
    } catch (error) {
      new Notice(error instanceof Error ? error.message : "Unable to load Knowledge Library Home.");
    }
  }

  private render(resources: StoredResource[], index: UnifiedKnowledgeIndex | null): void {
    const entries = buildHomeEntries(resources, index);
    const counts = homeOverviewCounts(entries, index);
    this.contentEl.empty();
    this.contentEl.addClass("knowledge-library-home-view");
    renderKnowledgeNavigation(this.contentEl, this.plugin, "home");

    this.renderSearch();
    this.renderQuickNavigation(counts);

    if (entries.length === 0) {
      this.renderEmptyState();
      return;
    }

    if (this.plugin.settings.homeShowContinueLearning) {
      this.renderEntrySection("Continue Learning", continueLearningEntries(entries), "Continue");
    }
    if (this.plugin.settings.homeShowTimeline) {
      this.renderTimeline(activityTimeline(entries));
    }
    this.renderEntrySection("Recent Resources", recentByRole(entries, "resources"), "Open");
    this.renderEntrySection("Recent Conversations", recentByRole(entries, "conversations"), "Open");
    this.renderEntrySection("Recent Documents", recentByRole(entries, "documents"), "Open");
    if (this.plugin.settings.enableTopicPages) {
      this.renderTopicSection(popularTopics(entries, this.plugin.settings.defaultTopicSort));
    }
    this.renderCollectionSection(favoriteCollections(entries));
    if (this.plugin.settings.homeShowTagCloud) {
      this.renderTagCloud(topTags(entries));
    }
  }

  private renderSearch(): void {
    const search = this.contentEl.createDiv({ cls: "knowledge-library-home-search" });
    const input = search.createEl("input", { attr: { "aria-label": "Search everything", title: "Search everything" } });
    input.type = "search";
    input.placeholder = "Search videos, conversations, documents, notes...";
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void this.plugin.openUniversalSearch(input.value.trim());
      }
      if (event.key === "Escape") {
        input.value = "";
      }
    });
    const button = search.createEl("button", { text: "Search Everything", cls: "knowledge-library-button mod-cta", attr: { "aria-label": "Search everything", title: "Search everything" } });
    button.addEventListener("click", () => void this.plugin.openUniversalSearch(input.value.trim()));
    setTimeout(() => input.focus(), 0);
  }

  private renderQuickNavigation(counts: HomeOverviewCounts): void {
    const nav = this.contentEl.createDiv({ cls: "knowledge-library-home-nav", attr: { "aria-label": "Knowledge navigation" } });
    nav.createDiv({ text: "Counts show unique logical items.", cls: "knowledge-library-home-count-note", attr: { title: "Counts are duplicate-suppressed logical items, not raw index entries." } });
    this.navButton(nav, "Resources", String(counts.resources), () => void this.plugin.openLibraryView({ role: "resources" }));
    this.navButton(nav, "Conversations", String(counts.conversations), () => void this.plugin.openLibraryView({ role: "conversations" }));
    this.navButton(nav, "Documents", String(counts.documents), () => void this.plugin.openLibraryView({ role: "documents" }));
    this.navButton(nav, "Collections", "Manage", () => this.plugin.openCollectionsManager());
    this.navButton(nav, "Dashboard", "Open", () => void this.plugin.openDashboardView());
    this.navButton(nav, "Universal Search", "Search", () => void this.plugin.openUniversalSearch());
    this.navButton(nav, "Settings", "Configure", () => this.openSettings());
  }

  private renderEmptyState(): void {
    const empty = this.contentEl.createDiv({ cls: "knowledge-library-home-empty" });
    empty.createEl("h3", { text: "Add your first resource" });
    this.emptyAction(empty, "Add your first resource", () => this.plugin.openAddResourceModal());
    this.emptyAction(empty, "Connect another vault", () => this.plugin.openVaultConnectorsManager());
    this.emptyAction(empty, "Import resources", () => void this.plugin.openLibraryView());
    this.emptyAction(empty, "Open documentation", () => void this.plugin.openUniversalSearch("KnowledgeLibrary documentation"));
  }

  private renderEntrySection(title: string, entries: UnifiedIndexEntry[], actionLabel: string): void {
    const section = this.section(title);
    if (entries.length === 0) {
      section.createDiv({ text: "No items yet.", cls: "knowledge-library-empty-state" });
      return;
    }
    const list = section.createDiv({ cls: "knowledge-library-home-list" });
    for (const entry of entries) {
      this.entryRow(list, entry, actionLabel);
    }
  }

  private renderTimeline(groups: HomeTimelineGroup[]): void {
    const section = this.section("Recent Activity");
    if (groups.length === 0) {
      section.createDiv({ text: "No recent activity this week.", cls: "knowledge-library-empty-state" });
      return;
    }
    for (const group of groups) {
      const groupEl = section.createDiv({ cls: "knowledge-library-home-timeline-group" });
      groupEl.createEl("h4", { text: group.label });
      const list = groupEl.createDiv({ cls: "knowledge-library-home-list" });
      for (const entry of group.entries) {
        this.entryRow(list, entry, "Open");
      }
    }
  }


  private renderTopicSection(topics: TopicSummary[]): void {
    const section = this.section("Popular Topics");
    const chips = section.createDiv({ cls: "knowledge-library-home-chip-row" });
    if (topics.length === 0) {
      chips.createDiv({ text: "No topics yet.", cls: "knowledge-library-empty-state" });
      return;
    }
    for (const topic of topics) {
      const chip = chips.createEl("button", { cls: "knowledge-library-home-chip", attr: { "aria-label": `Open topic ${topic.name}`, title: `Open topic ${topic.name}` } });
      chip.createSpan({ text: topic.name });
      chip.createSpan({ text: `${topic.entries.length} items`, cls: "knowledge-library-result-meta" });
      chip.addEventListener("click", () => void this.plugin.openTopicPage(topic.name));
    }
  }
  private renderCollectionSection(collections: Array<{ name: string; count: number }>): void {
    const section = this.section("Favorite Collections");
    const chips = section.createDiv({ cls: "knowledge-library-home-chip-row" });
    if (collections.length === 0) {
      chips.createDiv({ text: "No collections yet.", cls: "knowledge-library-empty-state" });
      return;
    }
    for (const collection of collections) {
      const chip = chips.createEl("button", { text: `${collection.name} ${collection.count}`, cls: "knowledge-library-home-chip", attr: { "aria-label": `Open collection ${collection.name}`, title: `Open collection ${collection.name}` } });
      chip.addEventListener("click", () => void this.plugin.openTopicPage(collection.name));
    }
  }

  private renderTagCloud(tags: HomeTagCloudItem[]): void {
    const section = this.section("Most Used Tags");
    const cloud = section.createDiv({ cls: "knowledge-library-home-tag-cloud" });
    if (tags.length === 0) {
      cloud.createDiv({ text: "No tags yet.", cls: "knowledge-library-empty-state" });
      return;
    }
    for (const tag of tags) {
      const chip = cloud.createEl("button", { text: `#${tag.tag}`, cls: `knowledge-library-home-tag is-weight-${tag.weight}`, attr: { "aria-label": `Open tag ${tag.tag}`, title: `Open tag ${tag.tag}` } });
      chip.addEventListener("click", () => void this.plugin.openTopicPage(tag.tag));
    }
  }

  private entryRow(parent: HTMLElement, entry: UnifiedIndexEntry, actionLabel: string): void {
    const row = parent.createDiv({ cls: "knowledge-library-home-row", attr: { tabindex: "0", role: "button", "aria-label": `Open ${entry.title}`, title: `Open ${entry.title}` } });
    const main = row.createDiv({ cls: "knowledge-library-home-row-main" });
    main.createDiv({ text: entry.title, cls: "knowledge-library-result-title" });
    main.createDiv({ text: [entry.connector_name, entry.vault_name, entry.type, entry.source_platform].filter(Boolean).join(" | "), cls: "knowledge-library-result-meta" });
    const progress = entry.progress ?? (entry.completed ? 100 : 0);
    row.createDiv({ text: progress > 0 ? `${progress}%` : "", cls: "knowledge-library-home-progress" });
    row.createDiv({ text: formatDisplayDate(entry), cls: "knowledge-library-result-meta" });
    row.createSpan({ text: actionLabel, cls: "knowledge-library-home-row-action" });
    const open = (): void => this.openEntry(entry);
    row.addEventListener("click", open);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  }

  private section(title: string): HTMLElement {
    const section = this.contentEl.createDiv({ cls: "knowledge-library-home-section" });
    section.createEl("h3", { text: title });
    return section;
  }

  private navButton(parent: HTMLElement, label: string, meta: string, onClick: () => void): void {
    const button = parent.createEl("button", { cls: "knowledge-library-home-nav-button", attr: { "aria-label": label, title: label } });
    button.createSpan({ text: label });
    button.createEl("strong", { text: meta });
    button.addEventListener("click", onClick);
  }

  private emptyAction(parent: HTMLElement, label: string, onClick: () => void): void {
    parent.createEl("button", { text: label, cls: "knowledge-library-button", attr: { "aria-label": label, title: label } }).addEventListener("click", onClick);
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

  private openSettings(): void {
    const appWithSettings = this.app as typeof this.app & { setting?: { open(): void; openTabById(id: string): void } };
    appWithSettings.setting?.open();
    appWithSettings.setting?.openTabById(this.plugin.manifest.id);
  }
}

export function buildHomeEntries(resources: StoredResource[], index: UnifiedKnowledgeIndex | null): UnifiedIndexEntry[] {
  const activeEntries = resources.map((item) => resourceToHomeEntry(item));
  return suppressHomeDuplicates([...activeEntries, ...(index?.entries ?? [])]);
}

export function homeOverviewCounts(entries: UnifiedIndexEntry[], index: UnifiedKnowledgeIndex | null = null): HomeOverviewCounts {
  return {
    resources: entries.filter((entry) => entry.role === "resources" || entry.role === "active").length,
    conversations: entries.filter((entry) => entry.role === "conversations").length,
    documents: entries.filter((entry) => entry.role === "documents").length,
    active: entries.filter((entry) => entry.origin === "active-vault").length,
    availableConnectors: index?.connector_statuses.filter((status) => status.connector.enabled && status.available).length ?? 0,
    unavailableConnectors: index?.connector_statuses.filter((status) => status.connector.enabled && !status.available).length ?? 0
  };
}

export function continueLearningEntries(entries: UnifiedIndexEntry[], limit = 8): UnifiedIndexEntry[] {
  return suppressHomeDuplicates(entries)
    .filter(isContinueLearningEligible)
    .sort(compareContinueLearning)
    .slice(0, limit);
}

export function recentByRole(entries: UnifiedIndexEntry[], role: VaultConnectorRole | "active", limit = 5): UnifiedIndexEntry[] {
  return suppressHomeDuplicates(entries)
    .filter((entry) => entry.role === role || role === "resources" && entry.role === "active")
    .sort((left, right) => compareDateValues(activityDate(right), activityDate(left)) || left.title.localeCompare(right.title))
    .slice(0, limit);
}

export function activityTimeline(entries: UnifiedIndexEntry[], now = new Date(), limitPerGroup = 5): HomeTimelineGroup[] {
  const groups: HomeTimelineGroup[] = [
    { label: "Today", entries: [] },
    { label: "Yesterday", entries: [] },
    { label: "This Week", entries: [] }
  ];
  for (const entry of suppressHomeDuplicates(entries).sort((left, right) => activityDate(right).localeCompare(activityDate(left)) || left.title.localeCompare(right.title))) {
    const group = timelineLabel(activityDate(entry), now);
    const target = groups.find((item) => item.label === group);
    if (target && target.entries.length < limitPerGroup) target.entries.push(entry);
  }
  return groups.filter((group) => group.entries.length > 0);
}

export function topTags(entries: UnifiedIndexEntry[], limit = 20): HomeTagCloudItem[] {
  const counts = new Map<string, number>();
  for (const entry of suppressHomeDuplicates(entries)) {
    for (const tag of entry.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  const max = Math.max(1, ...counts.values());
  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count, weight: Math.max(1, Math.min(5, Math.ceil(count / max * 5))) }));
}

export function favoriteCollections(entries: UnifiedIndexEntry[], limit = 8): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();
  const uniqueEntries = suppressHomeDuplicates(entries);
  const preferred = uniqueEntries.filter((entry) => entry.favorite || entry.priority === "high" || (entry.progress ?? 0) > 0);
  for (const entry of preferred.length > 0 ? preferred : uniqueEntries) {
    for (const collection of entry.collections) {
      counts.set(collection, (counts.get(collection) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}


export function popularTopics(entries: UnifiedIndexEntry[], sortMode = "popular", limit = 8): TopicSummary[] {
  return new TopicService().popularTopics(entries, limit).sort((left, right) => sortMode === "title" ? left.name.localeCompare(right.name) : sortMode === "recent" ? (right.updated_at ?? "").localeCompare(left.updated_at ?? "") || left.name.localeCompare(right.name) : right.score - left.score || left.name.localeCompare(right.name));
}
function resourceToHomeEntry(item: StoredResource): UnifiedIndexEntry {
  const { resource } = item;
  return {
    id: resource.id,
    origin: "active-vault",
    connector_id: "active-vault",
    connector_name: "Active vault",
    vault_name: "Active vault",
    role: "active",
    type: resource.type,
    title: resource.title,
    creator: resource.creator,
    path: item.path,
    url: resource.url,
    open_uri: item.path,
    tags: resource.tags,
    collections: resource.collections ?? [],
    excerpt: String(resource.metadata.description ?? ""),
    created_at: resource.createdAt,
    updated_at: resource.updatedAt,
    status: resource.status,
    favorite: resource.favorite,
    completed: resource.completed,
    progress: resource.progress,
    progress_unit: resource.progress_unit,
    priority: resource.priority,
    source_platform: resource.source,
    metadata: { ...resource.metadata, resourceId: resource.id, filePath: resource.filePath, current_position: resource.current_position, total_units: resource.total_units }
  };
}

export function suppressHomeDuplicates(entries: UnifiedIndexEntry[]): UnifiedIndexEntry[] {
  const byKey = new Map<string, UnifiedIndexEntry>();
  for (const entry of entries) {
    const keys = duplicateKeys(entry);
    const existing = keys.map((key) => byKey.get(key)).find((item): item is UnifiedIndexEntry => Boolean(item));
    if (!existing || compareHomeDuplicatePreference(entry, existing) < 0) {
      if (existing) {
        for (const existingKey of duplicateKeys(existing)) {
          if (byKey.get(existingKey) === existing) byKey.delete(existingKey);
        }
      }
      for (const key of keys) byKey.set(key, entry);
    }
  }
  return Array.from(new Set(byKey.values()));
}

export function isContinueLearningEligible(entry: UnifiedIndexEntry): boolean {
  const progress = normalizedProgress(entry);
  if (entry.completed || progress >= 100) return false;
  if (progress > 0 && progress < 100) return true;
  if (positionStarted(entry)) return true;
  if (lastOpened(entry)) return true;
  return entry.priority === "high";
}

function compareContinueLearning(left: UnifiedIndexEntry, right: UnifiedIndexEntry): number {
  return compareDateValues(lastOpened(right), lastOpened(left))
    || normalizedProgress(right) - normalizedProgress(left)
    || Number(right.priority === "high") - Number(left.priority === "high")
    || Number(Boolean(right.favorite)) - Number(Boolean(left.favorite))
    || compareDateValues(right.updated_at, left.updated_at)
    || left.title.localeCompare(right.title)
    || left.id.localeCompare(right.id);
}

function compareHomeDuplicatePreference(left: UnifiedIndexEntry, right: UnifiedIndexEntry): number {
  return Number(right.origin === "active-vault") - Number(left.origin === "active-vault")
    || compareDateValues(activityDate(right), activityDate(left))
    || left.id.localeCompare(right.id);
}

function timelineLabel(value: string, now: Date): HomeTimelineGroup["label"] | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYesterday = startToday - 24 * 60 * 60 * 1000;
  const time = date.getTime();
  if (time >= startToday) return "Today";
  if (time >= startYesterday) return "Yesterday";
  if (time >= startToday - 6 * 24 * 60 * 60 * 1000) return "This Week";
  return null;
}

function activityDate(entry: UnifiedIndexEntry): string {
  return lastOpened(entry) ?? (isValidDate(entry.updated_at) ? entry.updated_at ?? "" : "");
}

function lastOpened(entry: UnifiedIndexEntry): string | null {
  const value = firstString(entry.metadata.lastOpened, entry.metadata.last_opened, entry.metadata.opened_at);
  return isValidDate(value) ? value : null;
}

export function formatDisplayDate(entry: UnifiedIndexEntry): string {
  const opened = lastOpened(entry);
  if (opened) return `Last opened ${formatShortDate(opened)}`;
  if (isValidDate(entry.updated_at)) return `Updated ${formatShortDate(entry.updated_at ?? "")}`;
  return "";
}

function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function normalizedProgress(entry: UnifiedIndexEntry): number {
  return entry.progress ?? (entry.completed ? 100 : 0);
}

function positionStarted(entry: UnifiedIndexEntry): boolean {
  const current = numberValue(entry.metadata.current_position, entry.metadata.currentPosition);
  const total = numberValue(entry.metadata.total_units, entry.metadata.totalUnits);
  return current > 0 && total > 0;
}

function compareDateValues(left: string | null, right: string | null): number {
  const leftTime = timeValue(left);
  const rightTime = timeValue(right);
  return leftTime - rightTime;
}

function timeValue(value: string | null): number {
  const time = Date.parse(value ?? "");
  return Number.isFinite(time) ? time : 0;
}

function isValidDate(value: string | null): boolean {
  return Boolean(value && Number.isFinite(Date.parse(value)));
}

function numberValue(...values: unknown[]): number {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}
