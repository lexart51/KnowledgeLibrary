import { VaultConnector } from "../../models/VaultConnector";
import { PluginStateManager } from "./StateManager";

export class ConnectorRepository {
  constructor(private readonly stateManager: PluginStateManager) {}

  async list(): Promise<VaultConnector[]> {
    const state = await this.stateManager.loadState();
    return Array.isArray(state.vaultConnectors) ? state.vaultConnectors as VaultConnector[] : [];
  }
}
