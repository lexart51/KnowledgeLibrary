import { KnowledgeLibraryPluginSettings } from "../../core/settings";
import { PluginStateManager } from "./StateManager";

export class SettingsRepository {
  constructor(private readonly stateManager: PluginStateManager) {}

  async load(defaults: KnowledgeLibraryPluginSettings): Promise<KnowledgeLibraryPluginSettings> {
    const state = await this.stateManager.loadState();
    return { ...defaults, ...state, versionLabel: defaults.versionLabel } as KnowledgeLibraryPluginSettings;
  }

  async save(settings: KnowledgeLibraryPluginSettings): Promise<void> {
    await this.stateManager.updateState((state) => {
      Object.assign(state, settings);
    });
  }
}
