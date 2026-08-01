export interface PluginDataHost {
  loadData(): Promise<unknown>;
  saveData(data: unknown): Promise<void>;
  manifest?: { version?: string };
}

export interface PluginStateEnvelope extends Record<string, unknown> {
  state_version: number;
  plugin_version: string;
  state_backups?: PluginStateBackup[];
  diagnostics?: Record<string, unknown>;
}

export interface PluginStateBackup {
  id: string;
  created_at: string;
  reason: string;
  state: Record<string, unknown>;
}

export interface PluginConfigurationExport {
  exported_at: string;
  plugin_version: string;
  state_version: number;
  settings: Record<string, unknown>;
  connectors: unknown;
  saved_searches: unknown;
  collections_configuration: unknown;
  plugin_preferences: Record<string, unknown>;
}

export const CURRENT_STATE_VERSION = 1;
export const CURRENT_PLUGIN_VERSION = "6.5.0-alpha.2";
export const CURRENT_VERSION_LABEL = `KL ${CURRENT_PLUGIN_VERSION}`;

export class PluginStateManager {
  private lastState: PluginStateEnvelope | null = null;
  private recovered = false;

  constructor(private readonly host: PluginDataHost) {}

  async loadState(): Promise<PluginStateEnvelope> {
    try {
      const raw = await this.host.loadData();
      const migrated = this.migrate(this.validate(raw));
      this.lastState = migrated;
      const rawEnvelope = raw as { state_version?: unknown; plugin_version?: unknown; versionLabel?: unknown } | null;
      if (migrated.state_version !== rawEnvelope?.state_version || migrated.plugin_version !== rawEnvelope?.plugin_version || migrated.versionLabel !== rawEnvelope?.versionLabel) {
        await this.saveState(migrated);
      }
      return migrated;
    } catch (error) {
      this.recovered = true;
      const fallback = this.defaults();
      fallback.state_backups = [{ id: `corrupt-${Date.now()}`, created_at: new Date().toISOString(), reason: error instanceof Error ? error.message : "State load failed", state: {} }];
      await this.safeSave(fallback);
      this.lastState = fallback;
      return fallback;
    }
  }

  async saveState(state: Record<string, unknown>): Promise<PluginStateEnvelope> {
    const upgraded = this.migrate(this.validate(state));
    await this.safeSave(upgraded);
    this.lastState = upgraded;
    return upgraded;
  }

  async updateState(mutator: (state: PluginStateEnvelope) => void): Promise<PluginStateEnvelope> {
    const state = await this.loadState();
    mutator(state);
    return this.saveState(state);
  }

  async backup(reason: string): Promise<PluginStateBackup> {
    const state = await this.loadState();
    const backup: PluginStateBackup = { id: `backup-${Date.now()}`, created_at: new Date().toISOString(), reason, state: { ...state, state_backups: undefined } };
    const backups = [backup, ...(state.state_backups ?? [])].slice(0, 10);
    await this.saveState({ ...state, state_backups: backups });
    return backup;
  }

  async restore(backupId: string): Promise<PluginStateEnvelope> {
    const state = await this.loadState();
    const backup = (state.state_backups ?? []).find((item) => item.id === backupId);
    if (!backup) throw new Error("Backup not found.");
    return this.saveState({ ...backup.state, state_backups: state.state_backups });
  }

  async exportConfiguration(settingsKeys: string[]): Promise<PluginConfigurationExport> {
    const state = await this.loadState();
    const settings = Object.fromEntries(settingsKeys.filter((key) => key in state).map((key) => [key, state[key]]));
    return {
      exported_at: new Date().toISOString(),
      plugin_version: CURRENT_PLUGIN_VERSION,
      state_version: CURRENT_STATE_VERSION,
      settings,
      connectors: state.vaultConnectors ?? [],
      saved_searches: state.savedKnowledgeSearches ?? [],
      collections_configuration: state.collectionsConfiguration ?? null,
      plugin_preferences: settings
    };
  }

  async importConfiguration(payload: PluginConfigurationExport): Promise<PluginStateEnvelope> {
    await this.backup("Before configuration import");
    const state = await this.loadState();
    return this.saveState({
      ...state,
      ...(payload.settings ?? {}),
      vaultConnectors: payload.connectors ?? state.vaultConnectors,
      savedKnowledgeSearches: payload.saved_searches ?? state.savedKnowledgeSearches,
      collectionsConfiguration: payload.collections_configuration ?? state.collectionsConfiguration
    });
  }

  wasRecovered(): boolean {
    return this.recovered;
  }

  getLastState(): PluginStateEnvelope | null {
    return this.lastState;
  }

  private validate(raw: unknown): PluginStateEnvelope {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return this.defaults();
    }
    return { ...raw as Record<string, unknown>, state_version: numberOrDefault((raw as { state_version?: unknown }).state_version, 0), plugin_version: String((raw as { plugin_version?: unknown }).plugin_version ?? "0.0.0") };
  }

  private migrate(state: PluginStateEnvelope): PluginStateEnvelope {
    let current = { ...state };
    if (!current.state_version || current.state_version < 1) {
      current = { ...current, state_version: 1 };
    }
    return { ...current, state_version: CURRENT_STATE_VERSION, plugin_version: CURRENT_PLUGIN_VERSION, versionLabel: CURRENT_VERSION_LABEL };
  }

  private defaults(): PluginStateEnvelope {
    return { state_version: CURRENT_STATE_VERSION, plugin_version: CURRENT_PLUGIN_VERSION, versionLabel: CURRENT_VERSION_LABEL };
  }

  private async safeSave(state: PluginStateEnvelope): Promise<void> {
    await this.host.saveData(state);
  }
}

function numberOrDefault(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
