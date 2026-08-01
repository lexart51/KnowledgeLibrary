import { ItemView, Notice, WorkspaceLeaf } from "obsidian";
import { KNOWLEDGE_DASHBOARD_VIEW_TYPE } from "../core/viewTypes";
import KnowledgeLibraryPlugin from "../main";
import { CollectionService } from "../services/CollectionService";
import { ConnectorStatus, UnifiedKnowledgeIndex } from "../models/VaultConnector";
import { StoredResource } from "../services/VaultResourceRepository";
import { FileResourceService } from "../services/FileResourceService";
import { renderKnowledgeNavigation } from "./NavigationShell";

export interface DashboardStats {
  total: number;
  byType: Record<string, number>;
  byCollection: Record<string, number>;
  notStarted: number;
  inProgress: number;
  completed: number;
  favorites: number;
  highPriority: number;
  missingFiles: number;
  recentlyAdded: StoredResource[];
  recentlyUpdated: StoredResource[];
  connectorStatuses?: ConnectorStatus[];
  byRole?: Record<string, number>;
  byVault?: Record<string, number>;
  byPlatform?: Record<string, number>;
}

export class KnowledgeDashboardView extends ItemView {
  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: KnowledgeLibraryPlugin,
    private readonly collectionService = new CollectionService()
  ) {
    super(leaf);
  }

  getViewType(): string {
    return KNOWLEDGE_DASHBOARD_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Knowledge Dashboard";
  }

  async onOpen(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    try {
      const resources = await this.plugin.resourceRepository.list();
      const index = await this.plugin.unifiedIndexService.load();
      this.render(calculateDashboardStats(resources, this.collectionService, (path) => Boolean(this.app.vault.getAbstractFileByPath(FileResourceService.normalizeVaultPath(path)))), index);
    } catch (error) {
      new Notice(error instanceof Error ? error.message : "Unable to load Knowledge Dashboard.");
    }
  }

  private render(stats: DashboardStats, index: UnifiedKnowledgeIndex | null = null): void {
    this.contentEl.empty();
    this.contentEl.addClass("knowledge-library-dashboard");
    renderKnowledgeNavigation(this.contentEl, this.plugin, "dashboard");
    const header = this.contentEl.createDiv({ cls: "knowledge-library-universal-header" });
    header.createEl("h2", { text: "Knowledge Dashboard" });
    const searchButton = header.createEl("button", { text: "Universal Search", cls: "knowledge-library-button mod-cta", attr: { "aria-label": "Open universal search", title: "Open universal search" } });
    searchButton.addEventListener("click", () => void this.plugin.openUniversalSearch());
    const grid = this.contentEl.createDiv({ cls: "knowledge-library-dashboard-grid" });
    this.metric(grid, "Total resources", stats.total);
    this.metric(grid, "Not started", stats.notStarted);
    this.metric(grid, "In progress", stats.inProgress);
    this.metric(grid, "Completed", stats.completed);
    this.metric(grid, "Favorites", stats.favorites);
    this.metric(grid, "High priority", stats.highPriority);
    this.metric(grid, "Missing files", stats.missingFiles);
    this.section("By type", stats.byType);
    this.section("By collection", stats.byCollection);
    this.section("By role", stats.byRole ?? {});
    this.section("By vault", stats.byVault ?? {});
    this.section("By platform", stats.byPlatform ?? {});
    if (index) {
      const counts = this.plugin.unifiedIndexService.counts(index);
      this.section("Unified role counts", counts.byRole);
      this.section("Connector counts", counts.byConnector);
      this.unifiedRecentList("Recent conversations", index, "conversations");
      this.unifiedRecentList("Recent documents", index, "documents");
      this.unifiedRecentList("Recent resources", index, "resources");
      this.connectorStatusSection(index.connector_statuses);
    } else {
      this.connectorStatusSection(stats.connectorStatuses ?? []);
    }
    this.resourceList("Recently added", stats.recentlyAdded);
    this.resourceList("Recently updated", stats.recentlyUpdated);
  }

  private metric(parent: HTMLElement, label: string, value: number): void {
    const metric = parent.createDiv({ cls: "knowledge-library-report-metric" });
    metric.createSpan({ text: label });
    metric.createEl("strong", { text: String(value) });
  }

  private section(title: string, values: Record<string, number>): void {
    this.contentEl.createEl("h3", { text: title });
    const list = this.contentEl.createEl("ul", { cls: "knowledge-library-dashboard-list" });
    for (const [key, value] of Object.entries(values).sort(([left], [right]) => left.localeCompare(right))) {
      list.createEl("li", { text: `${key}: ${value}` });
    }
  }


  private connectorStatusSection(statuses: ConnectorStatus[]): void {
    this.contentEl.createEl("h3", { text: "Connector status" });
    const list = this.contentEl.createDiv({ cls: "knowledge-library-management-list" });
    for (const status of statuses) {
      const row = list.createDiv({ cls: "knowledge-library-connector-status-row" });
      row.createDiv({ text: status.connector.displayName, cls: "knowledge-library-management-name" });
      row.createDiv({ text: status.available ? "Available" : "Unavailable", cls: "knowledge-library-card-meta" });
      row.createDiv({ text: `${status.indexedItemCount} indexed`, cls: "knowledge-library-card-meta" });
      row.createDiv({ text: status.lastScanAt ?? "Never scanned", cls: "knowledge-library-card-meta" });
      row.createDiv({ text: status.error ?? "", cls: "knowledge-library-card-meta" });
    }
    const actions = this.contentEl.createDiv({ cls: "knowledge-library-view-actions" });
    const refresh = actions.createEl("button", { text: "Refresh connectors", cls: "knowledge-library-button", attr: { "aria-label": "Refresh connectors", title: "Refresh connectors" } });
    refresh.addEventListener("click", () => void this.plugin.refreshUnifiedIndex().then(() => this.refresh()));
    const rebuild = actions.createEl("button", { text: "Rebuild all", cls: "knowledge-library-button", attr: { "aria-label": "Rebuild unified index", title: "Rebuild unified index" } });
    rebuild.addEventListener("click", () => void this.plugin.rebuildUnifiedIndex().then(() => this.refresh()));
  }
  private unifiedRecentList(title: string, index: UnifiedKnowledgeIndex, role: string): void {
    this.contentEl.createEl("h3", { text: title });
    const list = this.contentEl.createEl("ul", { cls: "knowledge-library-dashboard-list" });
    const entries = index.entries.filter((entry) => entry.role === role).sort((left, right) => (right.updated_at ?? "").localeCompare(left.updated_at ?? "")).slice(0, 5);
    for (const entry of entries) {
      const item = list.createEl("li", { text: `${entry.title} - ${entry.connector_name}` });
      item.addEventListener("click", () => void this.plugin.openUniversalSearch(`role:${role} ${entry.title}`));
    }
  }
  private resourceList(title: string, resources: StoredResource[]): void {
    this.contentEl.createEl("h3", { text: title });
    const list = this.contentEl.createEl("ul", { cls: "knowledge-library-dashboard-list" });
    for (const item of resources) {
      list.createEl("li", { text: item.resource.title });
    }
  }
}

export function calculateDashboardStats(resources: StoredResource[], collectionService = new CollectionService(), fileExists: (path: string) => boolean = () => true): DashboardStats {
  const byType: Record<string, number> = {};
  for (const item of resources) {
    byType[item.resource.type] = (byType[item.resource.type] ?? 0) + 1;
  }

  const byCollection = Object.fromEntries(collectionService.collectionCounts(resources).map((item) => [item.name, item.count]));
  const progress = resources.map((item) => item.resource.progress ?? (item.resource.completed ? 100 : 0));

  return {
    total: resources.length,
    byType,
    byCollection,
    notStarted: progress.filter((value) => value <= 0).length,
    inProgress: progress.filter((value) => value > 0 && value < 100).length,
    completed: resources.filter((item) => item.resource.completed || (item.resource.progress ?? 0) >= 100).length,
    favorites: resources.filter((item) => item.resource.favorite).length,
    highPriority: resources.filter((item) => item.resource.priority === "high").length,
    missingFiles: resources.filter((item) => item.resource.filePath && !fileExists(item.resource.filePath)).length,
    recentlyAdded: [...resources].sort((left, right) => right.resource.createdAt.localeCompare(left.resource.createdAt)).slice(0, 5),
    recentlyUpdated: [...resources].sort((left, right) => right.resource.updatedAt.localeCompare(left.resource.updatedAt)).slice(0, 5)
  };
}
