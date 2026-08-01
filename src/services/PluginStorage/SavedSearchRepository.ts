import { SavedKnowledgeSearch } from "../SearchRankingService";
import { PluginStateManager } from "./StateManager";

const SAVED_SEARCHES_KEY = "savedKnowledgeSearches";

export class SavedSearchRepository {
  constructor(private readonly stateManager: PluginStateManager) {}

  async list(): Promise<SavedKnowledgeSearch[]> {
    const state = await this.stateManager.loadState();
    const value = state[SAVED_SEARCHES_KEY];
    return Array.isArray(value) ? value as SavedKnowledgeSearch[] : [];
  }

  async saveAll(searches: SavedKnowledgeSearch[]): Promise<void> {
    await this.stateManager.updateState((state) => {
      state[SAVED_SEARCHES_KEY] = searches;
    });
  }
}
