import { PluginStateManager } from "./StateManager";

export class CacheRepository {
  constructor(private readonly stateManager: PluginStateManager) {}

  async status(): Promise<{ readable: boolean; keys: string[] }> {
    const state = await this.stateManager.loadState();
    return { readable: true, keys: Object.keys(state).filter((key) => key.toLowerCase().includes("cache")) };
  }
}
