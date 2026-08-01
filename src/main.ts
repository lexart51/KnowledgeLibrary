import { Plugin, TFile } from "obsidian";
import { registerLibraryCommands } from "./commands/libraryCommands";
import { DEFAULT_SETTINGS, KnowledgeLibraryPluginSettings } from "./core/settings";
import { KNOWLEDGE_LIBRARY_VIEW_TYPE } from "./core/viewTypes";
import { AddResourceRequest, AddResourceResult, AddResourceService } from "./services/AddResourceService";
import { MigrationService } from "./services/MigrationService";
import { SafeMigrationService, TagConsolidationService, ThumbnailRepairService } from "./services/MaintenanceServices";
import { ResourceService } from "./services/ResourceService";
import { TagAliasService } from "./services/TagAliasService";
import { TagService } from "./services/TagService";
import { VaultResourceRepository } from "./services/VaultResourceRepository";
import { AddResourceModal } from "./ui/AddResourceModal";
import { KnowledgeLibrarySettingTab } from "./ui/KnowledgeLibrarySettingTab";
import { KnowledgeLibraryView } from "./ui/KnowledgeLibraryView";
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
    this.addSettingTab(new KnowledgeLibrarySettingTab(this.app, this));
    this.ribbonService.register();
    this.statusBarService.register();
    registerLibraryCommands(this);
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(KNOWLEDGE_LIBRARY_VIEW_TYPE);
    this.statusBarService?.unload();
  }

  openAddResourceModal(initialFilePath: string | null = null): void {
    new AddResourceModal(this.app, this, initialFilePath).open();
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
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...(await this.loadData())
    };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.initializeServices();
  }

  private initializeServices(): void {
    this.resourceRepository = new VaultResourceRepository(this.app, this.settings, undefined, undefined, this.tagService);
    this.addResourceService = new AddResourceService(this.app, this.settings, this.resourceService, this.resourceRepository, this.tagService);
    this.migrationService = new MigrationService(this.app);
    this.safeMigrationService = new SafeMigrationService(this.app, this.settings, this.migrationService, this.tagService);
    this.tagConsolidationService = new TagConsolidationService(this.app, this.tagService);
    this.thumbnailRepairService = new ThumbnailRepairService(this.app);
  }
}
