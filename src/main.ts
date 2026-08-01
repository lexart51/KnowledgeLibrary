import { Plugin } from "obsidian";
import { registerLibraryCommands } from "./commands/libraryCommands";
import { KnowledgeLibraryPluginSettings } from "./core/settings";
import { TagAliasService } from "./services/TagAliasService";
import { RibbonService } from "./ui/RibbonService";
import { StatusBarService } from "./ui/StatusBarService";

const DEFAULT_SETTINGS: KnowledgeLibraryPluginSettings = {
  versionLabel: "KL 6.0.0-alpha"
};

export default class KnowledgeLibraryPlugin extends Plugin {
  settings: KnowledgeLibraryPluginSettings = DEFAULT_SETTINGS;
  tagAliases!: TagAliasService;
  private ribbonService!: RibbonService;
  private statusBarService!: StatusBarService;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.tagAliases = new TagAliasService();
    this.ribbonService = new RibbonService(this);
    this.statusBarService = new StatusBarService(this, this.settings.versionLabel);

    this.ribbonService.register();
    this.statusBarService.register();
    registerLibraryCommands(this);
  }

  onunload(): void {
    this.statusBarService?.unload();
  }

  async loadSettings(): Promise<void> {
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...(await this.loadData())
    };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
