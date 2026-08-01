import { UnifiedKnowledgeIndex } from "../../models/VaultConnector";
import { PluginStateManager } from "./StateManager";

const INDEX_STORAGE_KEY = "unifiedKnowledgeIndex";

export class IndexRepository {
  constructor(private readonly stateManager: PluginStateManager) {}

  async load(): Promise<UnifiedKnowledgeIndex | null> {
    const state = await this.stateManager.loadState();
    const value = state[INDEX_STORAGE_KEY];
    return value && typeof value === "object" ? value as UnifiedKnowledgeIndex : null;
  }

  async save(index: UnifiedKnowledgeIndex): Promise<void> {
    await this.stateManager.updateState((state) => {
      state[INDEX_STORAGE_KEY] = index;
    });
  }
}
