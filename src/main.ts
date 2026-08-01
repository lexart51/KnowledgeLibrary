import { Plugin, TFile } from "obsidian";
import { registerLibraryCommands } from "./commands/libraryCommands";
import { DEFAULT_SETTINGS, KnowledgeLibraryPluginSettings } from "./core/settings";
import { KNOWLEDGE_DASHBOARD_VIEW_TYPE, KNOWLEDGE_LIBRARY_VIEW_TYPE } from "./core/viewTypes";
import { AddResourceRequest, AddResourceResult, AddResourceService } from "./services/AddResourceService";
import { MigrationService } from "./services/MigrationService";
import { CollectionService } from "./services/CollectionService";
import { UnifiedIndexService } from "./services/UnifiedIndexService";
import { RelationshipService } from "./services/RelationshipService";
import { SafeMigrationService, TagConsolidationService, ThumbnailRepairService } from "./services/MaintenanceServices";
import { ResourceService } from "./services/ResourceService";
import { TagAliasService } from "./services/TagAliasService";
import { TagService } from "./services/TagService";
import { VaultResourceRepository } from "./services/VaultResourceRepository";
import { AddResourceModal } from "./ui/AddResourceModal";
import { KnowledgeLibrarySettingTab } from "./ui/KnowledgeLibrarySettingTab";
import { KnowledgeLibraryView } from "./ui/KnowledgeLibraryView";
import { KnowledgeDashboardView } from "./ui/KnowledgeDashboardView";
import { CollectionManagementModal } from "./ui/CollectionManagementModal";
import { ResourceEditorModal } from "./ui/ResourceEditorModal";
import { VaultConnectorManagementModal } from "./ui/VaultConnectorManagementModal";
import { UnifiedSearchModal } from "./ui/UnifiedSearchModal";
import { RibbonService } from "./ui/RibbonService";
import { StatusBarService } from "./ui/StatusBarService";

export default class KnowledgeLibraryPlugin extends Plugin {
  settings: KnowledgeLibraryPluginSettings = DEFAULT_SETTINGS;
  tagAliases!: TagAliasService;
  tagService!: TagService;
  resourceService!: ResourceService;
  resourceRepository!: VaultResourceRepository;
  addResourceService!: AddResourceService;
  migrationService!: MigrationService;
  safeMigrationService!: SafeMigrationService;
  tagConsolidationService!: TagConsolidationService;
  thumbnailRepairService!: ThumbnailRepairService;
  collectionService!: CollectionService;
  relationshipService!: RelationshipService;
  unifiedIndexService!: UnifiedIndexService;
  private ribbonService!: RibbonService;
  private statusBarService!: StatusBarService;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.tagAliases = new TagAliasService();
    this.tagService = new TagService(this.tagAliases);
    this.resourceService = new ResourceService(undefined, this.tagService);
    this.initializeServices();
    this.ribbonService = new RibbonService(this, () => this.openLibraryView());
    this.statusBarService = new StatusBarService(this, this.settings.versionLabel);

    this.registerView(KNOWLEDGE_LIBRARY_VIEW_TYPE, (leaf) => new KnowledgeLibraryView(leaf, this));
    this.registerView(KNOWLEDGE_DASHBOARD_VIEW_TYPE, (leaf) => new KnowledgeDashboardView(leaf, this));
    this.addSettingTab(new KnowledgeLibrarySettingTab(this.app, this));
    this.ribbonService.register();
    this.statusBarService.register();
    registerLibraryCommands(this);
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(KNOWLEDGE_LIBRARY_VIEW_TYPE);
    this.app.workspace.detachLeavesOfType(KNOWLEDGE_DASHBOARD_VIEW_TYPE);
    this.statusBarService?.unload();
  }

  openAddResourceModal(initialFilePath: string | null = null): void {
    new AddResourceModal(this.app, this, initialFilePath).open();
  }


  openVaultConnectorsManager(): void {
    new VaultConnectorManagementModal(this.app, this).open();
  }

  openUnifiedSearch(): void {
    new UnifiedSearchModal(this.app, this).open();
  }

  async refreshUnifiedIndex(): Promise<void> {
    await this.unifiedIndexService.refresh();
  }

  async rebuildUnifiedIndex(): Promise<void> {
    await this.unifiedIndexService.rebuild();
  }
  openCollectionsManager(): void {
    new CollectionManagementModal(this.app, this.resourceRepository, this.collectionService, () => this.refreshLibraryViews()).open();
  }

  async openDashboardView(): Promise<void> {
    const existingLeaf = this.app.workspace.getLeavesOfType(KNOWLEDGE_DASHBOARD_VIEW_TYPE)[0];
    if (existingLeaf) {
      await this.app.workspace.revealLeaf(existingLeaf);
      return;
    }

    const leaf = this.app.workspace.getLeaf(true);
    await leaf.setViewState({ type: KNOWLEDGE_DASHBOARD_VIEW_TYPE, active: true });
    await this.app.workspace.revealLeaf(leaf);
  }

  async openSelectedResourceEditor(): Promise<void> {
    const activeFile = this.app.workspace.getActiveFile?.();
    const resources = await this.resourceRepository.list();
    const selected = activeFile instanceof TFile
      ? resources.find((item) => item.path === activeFile.path)
      : resources[0];

    if (!selected) {
      throw new Error("Open a Knowledge Library resource note before editing.");
    }

    new ResourceEditorModal(this.app, selected, this.resourceRepository, this.collectionService, this.relationshipService, () => this.refreshLibraryViews()).open();
  }

  async addResourceFromWizard(request: AddResourceRequest): Promise<AddResourceResult> {
    const result = await this.addResourceService.addResource(request);
    await this.refreshLibraryViews();
    await this.openResourceNote(result.stored.path);
    return result;
  }

  async refreshLibraryViews(): Promise<void> {
    await Promise.all(this.app.workspace.getLeavesOfType(KNOWLEDGE_LIBRARY_VIEW_TYPE).map(async (leaf) => {
      if (leaf.view instanceof KnowledgeLibraryView) {
        await leaf.view.refresh();
      }
    }));
  }

  async openResourceNote(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      await this.app.workspace.getLeaf(false).openFile(file);
    }
  }

  async openLibraryView(): Promise<void> {
    const existingLeaf = this.app.workspace.getLeavesOfType(KNOWLEDGE_LIBRARY_VIEW_TYPE)[0];
    if (existingLeaf) {
      await this.app.workspace.revealLeaf(existingLeaf);
      return;
    }

    const leaf = this.app.workspace.getLeaf(true);
    await leaf.setViewState({ type: KNOWLEDGE_LIBRARY_VIEW_TYPE, active: true });
    await this.app.workspace.revealLeaf(leaf);
  }

  async loadSettings(): Promise<void> {
    const data = (await this.loadData()) as Record<string, unknown> | null;
    const settingsData = { ...(data ?? {}) };
    delete settingsData.unifiedKnowledgeIndex;
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...settingsData
    } as typeof this.settings;
  }

  async saveSettings(): Promise<void> {
    const data = (await this.loadData()) as Record<string, unknown> | null;
    await this.saveData({ ...(data ?? {}), ...this.settings });
    this.initializeServices();
  }

  private initializeServices(): void {
    this.collectionService = new CollectionService();
    this.relationshipService = new RelationshipService();
    this.resourceRepository = new VaultResourceRepository(this.app, this.settings, undefined, undefined, this.tagService, this.collectionService);
    this.addResourceService = new AddResourceService(this.app, this.settings, this.resourceService, this.resourceRepository, this.tagService);
    this.unifiedIndexService = new UnifiedIndexService(this, undefined, undefined, this.tagService, this.collectionService);
    this.migrationService = new MigrationService(this.app);
    this.safeMigrationService = new SafeMigrationService(this.app, this.settings, this.migrationService, this.tagService);
    this.tagConsolidationService = new TagConsolidationService(this.app, this.tagService);
    this.thumbnailRepairService = new ThumbnailRepairService(this.app);
  }
}
