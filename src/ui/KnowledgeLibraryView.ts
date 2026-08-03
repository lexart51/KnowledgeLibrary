import { ItemView, Notice, TFile, WorkspaceLeaf } from "obsidian";
import { KNOWLEDGE_LIBRARY_VIEW_TYPE } from "../core/viewTypes";
import { KnowledgeResource } from "../models/KnowledgeResource";
import { UnifiedIndexEntry } from "../models/VaultConnector";
import KnowledgeLibraryPlugin from "../main";
import { FileResourceService, formatFileSize } from "../services/FileResourceService";
import { StoredResource } from "../services/VaultResourceRepository";
import { getYouTubeThumbnailFallbacks } from "./thumbnailFallbacks";

interface LibraryFilters {
  search: string;
  type: string;
  tag: string;
  status: string;
  source: string;
  vault: string;
  role: string;
  collection: string;
  priority: string;
  progress: string;
  favoritesOnly: boolean;
  completedOnly: boolean;
  missingOnly: boolean;
  sort: "progress" | "priority" | "added" | "updated" | "title";
}

const INITIAL_FILTERS: LibraryFilters = {
  search: "",
  type: "all",
  tag: "all",
  status: "all",
  source: "all",
  vault: "all",
  role: "all",
  collection: "all",
  priority: "all",
  progress: "all",
  favoritesOnly: false,
  completedOnly: false,
  missingOnly: false,
  sort: "updated"
};

export class KnowledgeLibraryView extends ItemView {
  private filters: LibraryFilters = { ...INITIAL_FILTERS };
  private resources: StoredResource[] = [];
  private unifiedEntries: UnifiedIndexEntry[] = [];
  private unavailableConnectorCount = 0;
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
      const index = await this.plugin.unifiedIndexService.load();
      this.unifiedEntries = index?.entries.filter((entry) => entry.origin === "external") ?? [];
      this.unavailableConnectorCount = index?.connector_statuses.filter((status) => status.connector.enabled && !status.available).length ?? 0;
      this.renderCards();
    } catch (error) {
      new Notice(error instanceof Error ? error.message : "Unable to refresh Knowledge Library.");
    }
  }

  private renderShell(): void {
    this.contentEl.empty();
    this.contentEl.addClass("knowledge-library-view");
    this.registerDragAndDrop();

    const header = this.contentEl.createDiv({ cls: "knowledge-library-view-header" });
    header.createEl("h2", { text: "Knowledge Library" });

    const headerActions = header.createDiv({ cls: "knowledge-library-view-actions" });
    const addButton = headerActions.createEl("button", { text: "Add", cls: "knowledge-library-button mod-cta", attr: { "aria-label": "Add resource", title: "Add resource" } });
    addButton.addEventListener("click", () => this.plugin.openAddResourceModal());
    const refreshButton = headerActions.createEl("button", { text: "Refresh", cls: "knowledge-library-button", attr: { "aria-label": "Refresh library", title: "Refresh library" } });
    refreshButton.addEventListener("click", () => void this.refresh());
    const searchButton = headerActions.createEl("button", { text: "Universal Search", cls: "knowledge-library-button", attr: { "aria-label": "Open universal search", title: "Open universal search" } });
    searchButton.addEventListener("click", () => {
      void this.plugin.openUniversalSearch().catch((error) => {
        new Notice(error instanceof Error ? error.message : "Unable to open universal search.");
      });
    });
    const dashboardButton = headerActions.createEl("button", { text: "Dashboard", cls: "knowledge-library-button", attr: { "aria-label": "Open dashboard", title: "Open dashboard" } });
    dashboardButton.addEventListener("click", () => {
      void this.plugin.openDashboardView().catch((error) => {
        new Notice(error instanceof Error ? error.message : "Unable to open dashboard.");
      });
    });

    const toolbar = this.contentEl.createDiv({ cls: "knowledge-library-toolbar" });
    const searchGroup = toolbar.createDiv({ cls: "knowledge-library-toolbar-group is-search" });
    const filterGroup = toolbar.createDiv({ cls: "knowledge-library-toolbar-group is-filters" });
    const toggleGroup = toolbar.createDiv({ cls: "knowledge-library-toolbar-group is-toggles" });
    const searchInput = searchGroup.createEl("input", { cls: "knowledge-library-search", attr: { "aria-label": "Search resources", title: "Search resources" } });
    searchInput.type = "search";
    searchInput.placeholder = "Search resources";
    searchInput.addEventListener("input", () => {
      this.filters.search = searchInput.value;
      this.renderCards();
    });

    this.createSelect(filterGroup, "Source", () => ["all", "Active vault", ...this.getAllConnectors()], (value) => {
      this.filters.source = value;
      this.renderCards();
    });
    this.createSelect(filterGroup, "Vault", () => ["all", ...this.getAllVaults()], (value) => {
      this.filters.vault = value;
      this.renderCards();
    });
    this.createSelect(filterGroup, "Role", () => ["all", ...this.getAllRoles()], (value) => {
      this.filters.role = value;
      this.renderCards();
    });
    this.createSelect(filterGroup, "Type", () => ["all", ...this.getAllTypes()], (value) => {
      this.filters.type = value;
      this.renderCards();
    });
    this.createSelect(filterGroup, "Tag", () => ["all", ...this.getAllTags()], (value) => {
      this.filters.tag = value;
      this.renderCards();
    });
    this.createSelect(filterGroup, "Collection", () => ["all", ...this.getAllCollections()], (value) => {
      this.filters.collection = value;
      this.renderCards();
    });
    const manageCollectionsButton = filterGroup.createEl("button", { text: "Manage collections", cls: "knowledge-library-button", attr: { "aria-label": "Manage collections", title: "Manage collections" } });
    manageCollectionsButton.addEventListener("click", () => this.plugin.openCollectionsManager());
    this.createSelect(filterGroup, "Priority", ["all", "low", "normal", "high"], (value) => {
      this.filters.priority = value;
      this.renderCards();
    });
    this.createSelect(filterGroup, "Progress", ["all", "not started", "in progress", "completed"], (value) => {
      this.filters.progress = value;
      this.renderCards();
    });
    this.createSelect(filterGroup, "Status", ["all", "active", "archived", "unavailable"], (value) => {
      this.filters.status = value;
      this.renderCards();
    });
    this.createSelect(filterGroup, "Sort", ["updated", "added", "title", "progress", "priority"], (value) => {
      this.filters.sort = value as LibraryFilters["sort"];
      this.renderCards();
    });

    this.createCheckbox(toggleGroup, "Favorites", (checked) => {
      this.filters.favoritesOnly = checked;
      this.renderCards();
    });
    this.createCheckbox(toggleGroup, "Completed", (checked) => {
      this.filters.completedOnly = checked;
      this.renderCards();
    });
    this.createCheckbox(toggleGroup, "Missing files", (checked) => {
      this.filters.missingOnly = checked;
      this.renderCards();
    });

    const roleTabs = this.contentEl.createDiv({ cls: "knowledge-library-role-tabs", attr: { "aria-label": "Role filters" } });
    for (const [label, role] of [["All", "all"], ["Resources", "resources"], ["Conversations", "conversations"], ["Documents", "documents"]]) {
      const button = roleTabs.createEl("button", { text: label, cls: "knowledge-library-role-tab", attr: { "aria-label": `Show ${label}`, title: `Show ${label}` } });
      button.addEventListener("click", () => {
        this.filters.role = role;
        this.renderCards();
      });
    }
    const scroll = this.contentEl.createDiv({ cls: "knowledge-library-scroll" });
    this.countElement = scroll.createDiv({ cls: "knowledge-library-count" });
    this.gridElement = scroll.createDiv({ cls: `knowledge-library-grid is-${this.plugin.settings.displayCardDensity}` });
  }

  private createSelect(parent: HTMLElement, labelText: string, options: string[] | (() => string[]), onChange: (value: string) => void): void {
    const label = parent.createEl("label", { cls: "knowledge-library-control" });
    label.createSpan({ text: labelText });
    const select = label.createEl("select", { attr: { "aria-label": `${labelText} filter`, title: `${labelText} filter` } });

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
    const checkbox = label.createEl("input", { attr: { "aria-label": labelText, title: labelText } });
    checkbox.type = "checkbox";
    label.createSpan({ text: labelText });
    checkbox.addEventListener("change", () => onChange(checkbox.checked));
  }

  private renderCards(): void {
    if (!this.gridElement || !this.countElement) {
      return;
    }

    const filtered = this.getFilteredResources();
    const external = this.getFilteredExternalEntries();
    const total = filtered.length + external.length;
    const connectorWarning = this.unavailableConnectorCount > 0 ? ` | ${this.unavailableConnectorCount} connector${this.unavailableConnectorCount === 1 ? "" : "s"} unavailable` : "";
    this.countElement.setText(`${total} item${total === 1 ? "" : "s"}${connectorWarning}`);
    this.gridElement.empty();

    for (const item of filtered) {
      this.renderCard(this.gridElement, item);
    }
    for (const entry of external) {
      this.renderExternalCard(this.gridElement, entry);
    }
  }

  private getFilteredResources(): StoredResource[] {
    const search = this.filters.search.trim().toLowerCase();
    const selectedTag = this.filters.tag === "all" ? "all" : this.plugin.tagService.normalizeTags([this.filters.tag])[0];
    const selectedCollection = this.filters.collection === "all" ? "all" : this.plugin.collectionService.normalizeCollectionName(this.filters.collection).toLowerCase();

    return this.resources
      .filter(({ resource }) => {
        const matchesSearch = !search || [resource.title, resource.creator, resource.source, resource.url, resource.filePath].some((value) => value?.toLowerCase().includes(search));
        const matchesSource = this.filters.source === "all" || this.filters.source === "Active vault";
        const matchesVault = this.filters.vault === "all" || this.filters.vault === "Active vault";
        const matchesRole = this.filters.role === "all" || this.filters.role === "active";
        const matchesType = this.filters.type === "all" || resource.type === this.filters.type;
        const resourceTags = this.plugin.tagService.normalizeTags(resource.tags);
        const matchesTag = selectedTag === "all" || resourceTags.includes(selectedTag);
        const resourceCollections = this.plugin.collectionService.normalizeCollections(resource.collections ?? []);
        const progress = resource.progress ?? (resource.completed ? 100 : 0);
        const matchesCollection = selectedCollection === "all" || resourceCollections.some((collection) => collection.toLowerCase() === selectedCollection);
        const matchesPriority = this.filters.priority === "all" || (resource.priority ?? "normal") === this.filters.priority;
        const matchesProgress = this.filters.progress === "all"
          || (this.filters.progress === "not started" && progress <= 0)
          || (this.filters.progress === "in progress" && progress > 0 && progress < 100)
          || (this.filters.progress === "completed" && (resource.completed || progress >= 100));
        const matchesStatus = this.filters.status === "all" || resource.status === this.filters.status;
        const matchesFavorite = !this.filters.favoritesOnly || resource.favorite;
        const matchesCompleted = !this.filters.completedOnly || resource.completed;
        const matchesMissing = !this.filters.missingOnly || this.isMissingFile(resource);
        return matchesSearch && matchesSource && matchesVault && matchesRole && matchesType && matchesTag && matchesCollection && matchesPriority && matchesProgress && matchesStatus && matchesFavorite && matchesCompleted && matchesMissing;
      })
      .sort((left, right) => {
        if (this.filters.sort === "title") {
          return left.resource.title.localeCompare(right.resource.title);
        }
        if (this.filters.sort === "progress") {
          return (right.resource.progress ?? 0) - (left.resource.progress ?? 0);
        }
        if (this.filters.sort === "priority") {
          const rank = { high: 3, normal: 2, low: 1 };
          return rank[right.resource.priority ?? "normal"] - rank[left.resource.priority ?? "normal"];
        }
        if (this.filters.sort === "added") {
          return right.resource.createdAt.localeCompare(left.resource.createdAt);
        }

        return right.resource.updatedAt.localeCompare(left.resource.updatedAt);
      });
  }


  private getFilteredExternalEntries(): UnifiedIndexEntry[] {
    const search = this.filters.search.trim().toLowerCase();
    const selectedTag = this.filters.tag === "all" ? "all" : this.plugin.tagService.normalizeTags([this.filters.tag])[0];
    const selectedCollection = this.filters.collection === "all" ? "all" : this.plugin.collectionService.normalizeCollectionName(this.filters.collection).toLowerCase();

    return this.unifiedEntries.filter((entry) => {
      const matchesSearch = !search || [entry.title, entry.creator, entry.connector_name, entry.vault_name, entry.source_platform, entry.excerpt, entry.path].some((value) => value?.toLowerCase().includes(search));
      const matchesSource = this.filters.source === "all" || entry.connector_name === this.filters.source;
      const matchesVault = this.filters.vault === "all" || entry.vault_name === this.filters.vault;
      const matchesRole = this.filters.role === "all" || entry.role === this.filters.role;
      const matchesType = this.filters.type === "all" || entry.type === this.filters.type;
      const matchesTag = selectedTag === "all" || entry.tags.includes(selectedTag);
      const matchesCollection = selectedCollection === "all" || entry.collections.some((collection) => collection.toLowerCase() === selectedCollection);
      const progress = entry.progress ?? (entry.completed ? 100 : 0);
      const matchesPriority = this.filters.priority === "all" || (entry.priority ?? "normal") === this.filters.priority;
      const matchesProgress = this.filters.progress === "all"
        || (this.filters.progress === "not started" && progress <= 0)
        || (this.filters.progress === "in progress" && progress > 0 && progress < 100)
        || (this.filters.progress === "completed" && (entry.completed || progress >= 100));
      const matchesFavorite = !this.filters.favoritesOnly || entry.favorite;
      const matchesCompleted = !this.filters.completedOnly || entry.completed;
      return matchesSearch && matchesSource && matchesVault && matchesRole && matchesType && matchesTag && matchesCollection && matchesPriority && matchesProgress && matchesFavorite && matchesCompleted && !this.filters.missingOnly;
    });
  }
  private renderCard(parent: HTMLElement, item: StoredResource): void {
    const { resource } = item;
    const card = parent.createDiv({ cls: `knowledge-library-card is-${resource.type}`, attr: { "data-resource-type": resource.type } });
    card.toggleClass("is-missing", this.isMissingFile(resource));
    const media = card.createDiv({ cls: "knowledge-library-card-media" });
    this.renderMedia(media, resource);

    const body = card.createDiv({ cls: "knowledge-library-card-body" });
    const badgeRow = body.createDiv({ cls: "knowledge-library-card-badge-row" });
    badgeRow.createSpan({ text: this.typeIcon(resource), cls: "knowledge-library-type-icon" });
    badgeRow.createSpan({ text: this.typeLabel(resource), cls: "knowledge-library-type-badge" });
    badgeRow.createSpan({ text: (resource.priority ?? "normal").toUpperCase(), cls: `knowledge-library-priority-badge is-${resource.priority ?? "normal"}` });
    body.createEl("h3", { text: resource.title, attr: { title: resource.title } });
    body.createDiv({ text: this.fileCardMeta(resource), cls: "knowledge-library-card-meta", attr: { title: this.fileCardMeta(resource) } });
    body.createDiv({ text: this.plugin.tagService.normalizeTags(resource.tags).join(" #"), cls: "knowledge-library-card-tags" });
    this.renderCollectionBadges(body, resource);
    this.renderProgress(body, resource);

    const actions = card.createDiv({ cls: "knowledge-library-card-actions" });
    this.createActionButton(actions, "Open note", `Open note for ${resource.title}`, () => void this.openNote(item.path));
    this.createActionButton(actions, "Open resource", `Open resource ${resource.title}`, () => void this.openResource(resource));
    this.createActionButton(actions, resource.favorite ? "Unfavorite" : "Favorite", resource.favorite ? `Unfavorite ${resource.title}` : `Favorite ${resource.title}`, () => void this.toggleFavorite(item));
    this.createActionButton(actions, resource.completed ? "Mark incomplete" : "Complete", resource.completed ? `Mark ${resource.title} incomplete` : `Mark ${resource.title} complete`, () => void this.toggleCompleted(item));
    this.createActionButton(actions, "Progress", `Edit progress for ${resource.title}`, () => void this.quickEditProgress(item));
  }


  private renderCollectionBadges(parent: HTMLElement, resource: KnowledgeResource): void {
    const collections = this.plugin.collectionService.normalizeCollections(resource.collections ?? []);
    if (collections.length === 0) {
      return;
    }
    const row = parent.createDiv({ cls: "knowledge-library-collection-badges" });
    for (const collection of collections) {
      row.createSpan({ text: collection, cls: "knowledge-library-collection-badge" });
    }
  }

  private renderProgress(parent: HTMLElement, resource: KnowledgeResource): void {
    const progress = resource.progress ?? (resource.completed ? 100 : 0);
    if (progress <= 0) {
      return;
    }
    const wrapper = parent.createDiv({ cls: "knowledge-library-progress" });
    const label = this.progressLabel(resource, progress);
    wrapper.createDiv({ cls: "knowledge-library-progress-label", text: label });
    const bar = wrapper.createDiv({ cls: "knowledge-library-progress-bar", attr: { "aria-label": label, title: label } });
    bar.createDiv({ cls: "knowledge-library-progress-fill", attr: { style: `width: ${Math.min(100, Math.max(0, progress))}%` } });
  }

  private progressLabel(resource: KnowledgeResource, progress: number): string {
    if (resource.current_position !== null && resource.current_position !== undefined && resource.total_units) {
      return `${resource.current_position}/${resource.total_units} ${resource.progress_unit ?? "units"} (${progress}%)`;
    }
    return `${progress}%`;
  }

  private renderExternalCard(parent: HTMLElement, entry: UnifiedIndexEntry): void {
    const card = parent.createDiv({ cls: `knowledge-library-card is-${entry.type} is-external`, attr: { "data-resource-type": entry.type, "data-connector-id": entry.connector_id } });
    card.createDiv({ cls: "knowledge-library-card-media" }).createDiv({ text: "EXT", cls: "knowledge-library-placeholder" });
    const body = card.createDiv({ cls: "knowledge-library-card-body" });
    const badgeRow = body.createDiv({ cls: "knowledge-library-card-badge-row" });
    badgeRow.createSpan({ text: entry.type.toUpperCase(), cls: "knowledge-library-type-badge" });
    badgeRow.createSpan({ text: entry.connector_name, cls: "knowledge-library-source-badge" });
    badgeRow.createSpan({ text: "External", cls: "knowledge-library-external-badge" });
    body.createEl("h3", { text: entry.title, attr: { title: entry.title } });
    body.createDiv({ text: `${entry.vault_name} | ${entry.role} | ${entry.path}`, cls: "knowledge-library-card-meta" });
    body.createDiv({ text: entry.excerpt, cls: "knowledge-library-card-meta" });
    const collections = this.plugin.collectionService.normalizeCollections(entry.collections);
    if (collections.length > 0) {
      const row = body.createDiv({ cls: "knowledge-library-collection-badges" });
      for (const collection of collections) row.createSpan({ text: collection, cls: "knowledge-library-collection-badge" });
    }
    const actions = card.createDiv({ cls: "knowledge-library-card-actions" });
    this.createActionButton(actions, "Open external", `Open external resource ${entry.title}`, () => this.openExternalEntry(entry));
  }

  private openExternalEntry(entry: UnifiedIndexEntry): void {
    if (entry.open_uri.startsWith("obsidian://")) {
      window.open(entry.open_uri, "_blank");
      return;
    }
    new Notice(entry.open_uri || entry.path);
  }
  private renderMedia(parent: HTMLElement, resource: KnowledgeResource): void {
    const imageSource = getVaultImageCardSource(resource, this.app);
    const videoId = typeof resource.metadata.videoId === "string" ? resource.metadata.videoId : null;
    const candidates = imageSource ? [imageSource] : resource.type === "youtube" ? getYouTubeThumbnailFallbacks(resource.thumbnail, resource.url, videoId) : resource.thumbnail ? [resource.thumbnail] : [];

    if (candidates.length > 0) {
      const image = parent.createEl("img", { attr: { src: candidates[0], alt: "" } });
      let fallbackIndex = 1;
      image.addEventListener("error", () => {
        const next = candidates[fallbackIndex];
        fallbackIndex += 1;
        if (next) {
          image.src = next;
        } else {
          image.remove();
          parent.createDiv({ text: resource.type.toUpperCase(), cls: "knowledge-library-placeholder" });
        }
      });
      return;
    }

    parent.createDiv({ text: this.typeIcon(resource), cls: "knowledge-library-placeholder" });
  }

  private typeIcon(resource: KnowledgeResource): string {
    switch (resource.type) {
      case "youtube": return "YT";
      case "website": return "WEB";
      case "pdf": return "PDF";
      case "powerpoint": return "PPT";
      case "document": return "DOC";
      case "book": return "BOOK";
      case "markdown": return "MD";
      case "image": return "IMG";
      case "script": return "CODE";
      case "skill": return "SKILL";
      case "archive": return "ZIP";
      default: return "OTHER";
    }
  }

  private typeLabel(resource: KnowledgeResource): string {
    switch (resource.type) {
      case "youtube": return "YouTube";
      case "website": return "Website";
      case "pdf": return "PDF";
      case "powerpoint": return "PowerPoint";
      case "document": return "Document";
      case "book": return "Book";
      case "markdown": return "Markdown";
      case "image": return "Image";
      case "script": return "Script";
      case "skill": return "Skill";
      case "archive": return "Archive";
      default: return "Other";
    }
  }

  private fileCardMeta(resource: KnowledgeResource): string {
    if (!resource.filePath) {
      return resource.creator ?? resource.source;
    }

    const parts = [
      String(resource.metadata.filename ?? FileResourceService.filenameFromPath(resource.filePath)),
      resource.creator,
      resource.type,
      this.plugin.settings.showFileSizeOnCards ? formatFileSize(resource.metadata.fileSizeBytes) : null,
      String(resource.metadata.parentFolder ?? FileResourceService.parentFolderFromPath(resource.filePath)),
      this.isMissingFile(resource) ? "missing" : null
    ].filter((value): value is string => Boolean(value));

    return parts.join(" | ");
  }

  private createActionButton(parent: HTMLElement, text: string, ariaLabel: string, onClick: () => void): void {
    const button = parent.createEl("button", { text, cls: "knowledge-library-button", attr: { "aria-label": ariaLabel, title: ariaLabel } });
    button.addEventListener("click", onClick);
  }

  private async openNote(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      await this.app.workspace.getLeaf(false).openFile(file);
    }
  }

  private async openResource(resource: KnowledgeResource): Promise<void> {
    if (resource.filePath) {
      const file = this.app.vault.getAbstractFileByPath(FileResourceService.normalizeVaultPath(resource.filePath));
      if (file instanceof TFile) {
        await this.app.workspace.getLeaf(false).openFile(file);
      } else {
        new Notice("Original vault file is missing.");
      }
      return;
    }

    if (resource.url) {
      window.open(resource.url, "_blank");
    }
  }

  private isMissingFile(resource: KnowledgeResource): boolean {
    return Boolean(resource.filePath && !(this.app.vault.getAbstractFileByPath(FileResourceService.normalizeVaultPath(resource.filePath)) instanceof TFile));
  }

  private registerDragAndDrop(): void {
    if (!this.plugin.settings.enableDragAndDrop) {
      return;
    }

    this.contentEl.addEventListener("dragover", (event) => {
      event.preventDefault();
    });
    this.contentEl.addEventListener("drop", (event) => {
      event.preventDefault();
      const path = event.dataTransfer?.getData("text/plain") || event.dataTransfer?.getData("text/uri-list") || "";
      const file = path ? this.app.vault.getAbstractFileByPath(FileResourceService.normalizeVaultPath(path)) : null;
      if (file instanceof TFile && FileResourceService.isAllowedFile(file, this.plugin.settings)) {
        this.plugin.openAddResourceModal(file.path);
      } else {
        new Notice("Drop a file from this vault to add it to Knowledge Library.");
      }
    });
  }

  private async toggleFavorite(item: StoredResource): Promise<void> {
    item.resource.favorite = !item.resource.favorite;
    await this.plugin.resourceRepository.update(item.path, item.resource);
    await this.refresh();
  }

  private async toggleCompleted(item: StoredResource): Promise<void> {
    item.resource.completed = !item.resource.completed;
    if (item.resource.completed) {
      item.resource.progress = 100;
    }
    await this.plugin.resourceRepository.update(item.path, item.resource);
    await this.refresh();
  }


  private async quickEditProgress(item: StoredResource): Promise<void> {
    const current = String(item.resource.progress ?? 0);
    const value = window.prompt("Progress from 0 to 100", current);
    if (value === null) {
      return;
    }
    const progress = Number(value);
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      new Notice("Progress must be from 0 to 100.");
      return;
    }
    item.resource.progress = Math.round(progress);
    if (item.resource.progress === 100) {
      item.resource.completed = true;
    }
    await this.plugin.resourceRepository.update(item.path, item.resource);
    await this.refresh();
  }
  private getAllTags(): string[] {
    return this.plugin.tagService.normalizeTags([
      ...this.resources.flatMap((item) => item.resource.tags),
      ...this.unifiedEntries.flatMap((entry) => entry.tags)
    ]).sort();
  }

  private getAllCollections(): string[] {
    return this.plugin.collectionService.normalizeCollections([
      ...this.resources.flatMap((item) => item.resource.collections ?? []),
      ...this.unifiedEntries.flatMap((entry) => entry.collections)
    ]);
  }

  private getAllConnectors(): string[] {
    return Array.from(new Set(this.unifiedEntries.map((entry) => entry.connector_name))).sort();
  }

  private getAllVaults(): string[] {
    return Array.from(new Set(["Active vault", ...this.unifiedEntries.map((entry) => entry.vault_name)])).sort();
  }

  private getAllRoles(): string[] {
    return Array.from(new Set(["active", ...this.unifiedEntries.map((entry) => String(entry.role))])).sort();
  }

  private getAllTypes(): string[] {
    return Array.from(new Set([
      "youtube",
      "website",
      "pdf",
      "powerpoint",
      "document",
      "book",
      "markdown",
      "image",
      "script",
      "skill",
      "archive",
      "file",
      "other",
      ...this.unifiedEntries.map((entry) => entry.type)
    ])).sort();
  }
}

export function getVaultImageCardSource(resource: KnowledgeResource, app: { vault: { getAbstractFileByPath(path: string): unknown; getResourcePath?: (file: TFile) => string } }): string | null {
  if (resource.type !== "image" || !resource.filePath) {
    return null;
  }

  const file = app.vault.getAbstractFileByPath(FileResourceService.normalizeVaultPath(resource.filePath));
  if (!(file instanceof TFile)) {
    return null;
  }

  return app.vault.getResourcePath ? app.vault.getResourcePath(file) : resource.filePath;
}
