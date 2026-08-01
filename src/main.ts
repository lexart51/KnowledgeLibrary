import { Plugin } from "obsidian";
import { registerLibraryCommands } from "./commands/libraryCommands";
import { DEFAULT_SETTINGS, KnowledgeLibraryPluginSettings } from "./core/settings";
import { KNOWLEDGE_LIBRARY_VIEW_TYPE } from "./core/viewTypes";
import { MigrationService } from "./services/MigrationService";
import { ResourceService } from "./services/ResourceService";
import { TagAliasService } from "./services/TagAliasService";
import { TagService } from "./services/TagService";
import { VaultResourceRepository } from "./services/VaultResourceRepository";
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
  migrationService!: MigrationService;
  private ribbonService!: RibbonService;
  private statusBarService!: StatusBarService;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.tagAliases = new TagAliasService();
    this.tagService = new TagService(this.tagAliases);
    this.resourceService = new ResourceService(undefined, this.tagService);
    this.resourceRepository = new VaultResourceRepository(this.app, this.settings, undefined, undefined, this.tagService);
    this.migrationService = new MigrationService(this.app);
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
    this.resourceRepository = new VaultResourceRepository(this.app, this.settings, undefined, undefined, this.tagService);
    this.migrationService = new MigrationService(this.app);
  }
}
