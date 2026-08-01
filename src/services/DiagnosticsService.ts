import { App } from "obsidian";
import KnowledgeLibraryPlugin from "../main";
import { CURRENT_PLUGIN_VERSION, CURRENT_STATE_VERSION } from "./PluginStorage/StateManager";

export interface DiagnosticsReport {
  pluginVersion: string;
  stateSchemaVersion: number;
  buildVersion: string;
  currentVault: string;
  connectorCount: number;
  availableConnectors: number;
  unavailableConnectors: number;
  unifiedIndexStatus: string;
  itemsIndexed: number;
  lastRebuild: string | null;
  cacheStatus: string;
  pluginDataPath: string;
  obsidianVersion: string;
  operatingSystem: string;
}

export class DiagnosticsService {
  constructor(private readonly plugin: KnowledgeLibraryPlugin) {}

  async collect(): Promise<DiagnosticsReport> {
    const state = await this.plugin.stateManager.loadState();
    const index = await this.plugin.indexRepository.load();
    const statuses = index?.connector_statuses ?? [];
    return {
      pluginVersion: CURRENT_PLUGIN_VERSION,
      stateSchemaVersion: typeof state.state_version === "number" ? state.state_version : CURRENT_STATE_VERSION,
      buildVersion: this.plugin.manifest.version ?? CURRENT_PLUGIN_VERSION,
      currentVault: this.vaultName(this.plugin.app),
      connectorCount: this.plugin.settings.vaultConnectors.length,
      availableConnectors: statuses.filter((status) => status.connector.enabled && status.available).length,
      unavailableConnectors: statuses.filter((status) => status.connector.enabled && !status.available).length,
      unifiedIndexStatus: index ? "readable" : "missing",
      itemsIndexed: index?.entries.length ?? 0,
      lastRebuild: index?.rebuilt_at ?? null,
      cacheStatus: (await this.plugin.cacheRepository.status()).readable ? "readable" : "unavailable",
      pluginDataPath: `${this.plugin.app.vault.configDir}/plugins/${this.plugin.manifest.id}/data.json`,
      obsidianVersion: (this.plugin.app as unknown as { version?: string }).version ?? "unknown",
      operatingSystem: typeof process !== "undefined" ? `${process.platform} ${process.arch}` : "unknown"
    };
  }

  async runSelfDiagnostics(): Promise<string> {
    const lines: string[] = [];
    try {
      await this.plugin.stateManager.loadState();
      lines.push("Plugin state readable: yes");
    } catch (error) {
      lines.push(`Plugin state readable: no - ${message(error)}`);
    }
    try {
      await this.plugin.connectorRepository.list();
      lines.push("Connectors readable: yes");
    } catch (error) {
      lines.push(`Connectors readable: no - ${message(error)}`);
    }
    try {
      await this.plugin.indexRepository.load();
      lines.push("Index readable: yes");
    } catch (error) {
      lines.push(`Index readable: no - ${message(error)}`);
    }
    try {
      await this.plugin.savedSearchRepository.list();
      lines.push("Saved searches readable: yes");
    } catch (error) {
      lines.push(`Saved searches readable: no - ${message(error)}`);
    }
    try {
      await this.plugin.diagnosticsRepository.write({ self_test_at: new Date().toISOString() });
      lines.push("Diagnostics writable: yes");
      lines.push("Permissions: plugin data writable");
    } catch (error) {
      lines.push(`Diagnostics writable: no - ${message(error)}`);
      lines.push("Permissions: plugin data write failed");
    }
    return lines.join("\n");
  }

  format(report: DiagnosticsReport): string {
    return Object.entries(report).map(([key, value]) => `${key}: ${value ?? ""}`).join("\n");
  }

  private vaultName(app: App): string {
    return (app.vault as unknown as { getName?: () => string }).getName?.() ?? "unknown";
  }
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
