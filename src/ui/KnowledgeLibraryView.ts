import { ItemView, Notice, TFile, WorkspaceLeaf } from "obsidian";
import { KNOWLEDGE_LIBRARY_VIEW_TYPE } from "../core/viewTypes";
import { KnowledgeResource } from "../models/KnowledgeResource";
import KnowledgeLibraryPlugin from "../main";
import { StoredResource } from "../services/VaultResourceRepository";
import { getYouTubeThumbnailFallbacks } from "./thumbnailFallbacks";

interface LibraryFilters {
  search: string;
  type: string;
  tag: string;
  status: string;
  favoritesOnly: boolean;
  completedOnly: boolean;
  sort: "updated" | "title";
}

const INITIAL_FILTERS: LibraryFilters = {
  search: "",
  type: "all",
  tag: "all",
  status: "all",
  favoritesOnly: false,
  completedOnly: false,
  sort: "updated"
};

export class KnowledgeLibraryView extends ItemView {
  private filters: LibraryFilters = { ...INITIAL_FILTERS };
  private resources: StoredResource[] = [];
  private gridElement: HTMLElement | null = null;
  private countElement: HTMLElement | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: KnowledgeLibraryPlugin
  ) {
    super(leaf);
  }

  getViewType(): string {
    return KNOWLEDGE_LIBRARY_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Knowledge Library";
  }

  async onOpen(): Promise<void> {
    this.renderShell();
    await this.refresh();
  }

  async refresh(): Promise<void> {
    try {
      this.resources = await this.plugin.resourceRepository.list();
      this.renderCards();
    } catch (error) {
      new Notice(error instanceof Error ? error.message : "Unable to refresh Knowledge Library.");
    }
  }

  private renderShell(): void {
    this.containerEl.empty();
    this.containerEl.addClass("knowledge-library-view");

    const header = this.containerEl.createDiv({ cls: "knowledge-library-view-header" });
    header.createEl("h2", { text: "Knowledge Library" });

    const headerActions = header.createDiv({ cls: "knowledge-library-view-actions" });
    const addButton = headerActions.createEl("button", { text: "Add", cls: "knowledge-library-button mod-cta" });
    addButton.addEventListener("click", () => this.plugin.openAddResourceModal());
    const refreshButton = headerActions.createEl("button", { text: "Refresh", cls: "knowledge-library-button" });
    refreshButton.addEventListener("click", () => void this.refresh());

    const controls = this.containerEl.createDiv({ cls: "knowledge-library-controls" });
    const searchInput = controls.createEl("input", { cls: "knowledge-library-search" });
    searchInput.type = "search";
    searchInput.placeholder = "Search resources";
    searchInput.addEventListener("input", () => {
      this.filters.search = searchInput.value;
      this.renderCards();
    });

    this.createSelect(controls, "Type", ["all", "youtube", "website", "file"], (value) => {
      this.filters.type = value;
      this.renderCards();
    });
    this.createSelect(controls, "Tag", () => ["all", ...this.getAllTags()], (value) => {
      this.filters.tag = value;
      this.renderCards();
    });
    this.createSelect(controls, "Status", ["all", "active", "archived", "unavailable"], (value) => {
      this.filters.status = value;
      this.renderCards();
    });
    this.createSelect(controls, "Sort", ["updated", "title"], (value) => {
      this.filters.sort = value as LibraryFilters["sort"];
      this.renderCards();
    });

    this.createCheckbox(controls, "Favorites", (checked) => {
      this.filters.favoritesOnly = checked;
      this.renderCards();
    });
    this.createCheckbox(controls, "Completed", (checked) => {
      this.filters.completedOnly = checked;
      this.renderCards();
    });

    this.countElement = this.containerEl.createDiv({ cls: "knowledge-library-count" });
    this.gridElement = this.containerEl.createDiv({ cls: `knowledge-library-grid is-${this.plugin.settings.displayCardDensity}` });
  }

  private createSelect(parent: HTMLElement, labelText: string, options: string[] | (() => string[]), onChange: (value: string) => void): void {
    const label = parent.createEl("label", { cls: "knowledge-library-control" });
    label.createSpan({ text: labelText });
    const select = label.createEl("select");

    const populate = (): void => {
      select.empty();
      const values = typeof options === "function" ? options() : options;
      for (const value of values) {
        select.createEl("option", { text: value, value });
      }
    };

    populate();
    select.addEventListener("focus", populate);
    select.addEventListener("change", () => onChange(select.value));
  }

  private createCheckbox(parent: HTMLElement, labelText: string, onChange: (checked: boolean) => void): void {
    const label = parent.createEl("label", { cls: "knowledge-library-checkbox" });
    const checkbox = label.createEl("input");
    checkbox.type = "checkbox";
    label.createSpan({ text: labelText });
    checkbox.addEventListener("change", () => onChange(checkbox.checked));
  }

  private renderCards(): void {
    if (!this.gridElement || !this.countElement) {
      return;
    }

    const filtered = this.getFilteredResources();
    this.countElement.setText(`${filtered.length} item${filtered.length === 1 ? "" : "s"}`);
    this.gridElement.empty();

    for (const item of filtered) {
      this.renderCard(this.gridElement, item);
    }
  }

  private getFilteredResources(): StoredResource[] {
    const search = this.filters.search.trim().toLowerCase();

    return this.resources
      .filter(({ resource }) => {
        const matchesSearch = !search || [resource.title, resource.creator, resource.source, resource.url, resource.filePath].some((value) => value?.toLowerCase().includes(search));
        const matchesType = this.filters.type === "all" || resource.type === this.filters.type;
        const matchesTag = this.filters.tag === "all" || resource.tags.includes(this.filters.tag);
        const matchesStatus = this.filters.status === "all" || resource.status === this.filters.status;
        const matchesFavorite = !this.filters.favoritesOnly || resource.favorite;
        const matchesCompleted = !this.filters.completedOnly || resource.completed;
        return matchesSearch && matchesType && matchesTag && matchesStatus && matchesFavorite && matchesCompleted;
      })
      .sort((left, right) => {
        if (this.filters.sort === "title") {
          return left.resource.title.localeCompare(right.resource.title);
        }

        return right.resource.updatedAt.localeCompare(left.resource.updatedAt);
      });
  }

  private renderCard(parent: HTMLElement, item: StoredResource): void {
    const { resource } = item;
    const card = parent.createDiv({ cls: "knowledge-library-card" });
    const media = card.createDiv({ cls: "knowledge-library-card-media" });
    this.renderMedia(media, resource);

    const body = card.createDiv({ cls: "knowledge-library-card-body" });
    body.createEl("h3", { text: resource.title });
    body.createDiv({ text: resource.creator ?? resource.source, cls: "knowledge-library-card-meta" });
    body.createDiv({ text: resource.tags.join(" #"), cls: "knowledge-library-card-tags" });

    const actions = card.createDiv({ cls: "knowledge-library-card-actions" });
    this.createActionButton(actions, "Open note", () => void this.openNote(item.path));
    this.createActionButton(actions, "Open resource", () => this.openExternal(resource));
    this.createActionButton(actions, resource.favorite ? "Unfavorite" : "Favorite", () => void this.toggleFavorite(item));
    this.createActionButton(actions, resource.completed ? "Mark incomplete" : "Complete", () => void this.toggleCompleted(item));
  }

  private renderMedia(parent: HTMLElement, resource: KnowledgeResource): void {
    if (resource.thumbnail) {
      const image = parent.createEl("img", { attr: { src: resource.thumbnail, alt: "" } });
      const fallbacks = resource.type === "youtube" ? getYouTubeThumbnailFallbacks(resource.thumbnail, resource.url) : [];
      let fallbackIndex = 0;
      image.addEventListener("error", () => {
        const next = fallbacks[fallbackIndex];
        fallbackIndex += 1;
        if (next && image.src !== next) {
          image.src = next;
        } else {
          image.remove();
          parent.createDiv({ text: resource.type.toUpperCase(), cls: "knowledge-library-placeholder" });
        }
      });
      return;
    }

    parent.createDiv({ text: resource.type.toUpperCase(), cls: "knowledge-library-placeholder" });
  }

  private createActionButton(parent: HTMLElement, text: string, onClick: () => void): void {
    const button = parent.createEl("button", { text, cls: "knowledge-library-button" });
    button.addEventListener("click", onClick);
  }

  private async openNote(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      await this.app.workspace.getLeaf(false).openFile(file);
    }
  }

  private openExternal(resource: KnowledgeResource): void {
    const target = resource.url ?? (resource.filePath ? `file://${resource.filePath}` : null);
    if (target) {
      window.open(target, "_blank");
    }
  }

  private async toggleFavorite(item: StoredResource): Promise<void> {
    item.resource.favorite = !item.resource.favorite;
    await this.plugin.resourceRepository.update(item.path, item.resource);
    await this.refresh();
  }

  private async toggleCompleted(item: StoredResource): Promise<void> {
    item.resource.completed = !item.resource.completed;
    await this.plugin.resourceRepository.update(item.path, item.resource);
    await this.refresh();
  }

  private getAllTags(): string[] {
    return Array.from(new Set(this.resources.flatMap((item) => item.resource.tags))).sort();
  }
}
