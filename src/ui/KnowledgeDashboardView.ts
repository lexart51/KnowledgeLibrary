import { ItemView, Notice, WorkspaceLeaf } from "obsidian";
import { KNOWLEDGE_DASHBOARD_VIEW_TYPE } from "../core/viewTypes";
import KnowledgeLibraryPlugin from "../main";
import { CollectionService } from "../services/CollectionService";
import { StoredResource } from "../services/VaultResourceRepository";
import { FileResourceService } from "../services/FileResourceService";

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
      this.render(calculateDashboardStats(resources, this.collectionService, (path) => Boolean(this.app.vault.getAbstractFileByPath(FileResourceService.normalizeVaultPath(path)))));
    } catch (error) {
      new Notice(error instanceof Error ? error.message : "Unable to load Knowledge Dashboard.");
    }
  }

  private render(stats: DashboardStats): void {
    this.contentEl.empty();
    this.contentEl.addClass("knowledge-library-dashboard");
    this.contentEl.createEl("h2", { text: "Knowledge Dashboard" });
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
