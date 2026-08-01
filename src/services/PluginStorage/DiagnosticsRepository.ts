import { PluginStateManager } from "./StateManager";

export class DiagnosticsRepository {
  constructor(private readonly stateManager: PluginStateManager) {}

  async write(report: Record<string, unknown>): Promise<void> {
    await this.stateManager.updateState((state) => {
      state.diagnostics = { ...(state.diagnostics ?? {}), last_report: report, updated_at: new Date().toISOString() };
    });
  }

  async read(): Promise<Record<string, unknown> | null> {
    const state = await this.stateManager.loadState();
    return state.diagnostics ?? null;
  }
}
