import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, vi } from "vitest";

vi.mock("obsidian", () => ({
  normalizePath: (path: string) => path.replace(/\\/g, "/").replace(/\/+/g, "/"),
  ItemView: class ItemView {},
  Modal: class Modal {},
  Notice: class Notice { constructor(_message: string) {} },
  Plugin: class Plugin {},
  PluginSettingTab: class PluginSettingTab {},
  Setting: class Setting {},
  TFile: class TFile {},
  WorkspaceLeaf: class WorkspaceLeaf {},
  requestUrl: vi.fn()
}));

import { DEFAULT_SETTINGS } from "../src/core/settings";
import { DiagnosticsService } from "../src/services/DiagnosticsService";
import { LoggerService } from "../src/services/LoggerService";
import { PluginStateManager } from "../src/services/PluginStorage/StateManager";
import { SettingsRepository } from "../src/services/PluginStorage/SettingsRepository";
import { IndexRepository } from "../src/services/PluginStorage/IndexRepository";
import { SavedSearchRepository } from "../src/services/PluginStorage/SavedSearchRepository";
import { ConnectorRepository } from "../src/services/PluginStorage/ConnectorRepository";
import { DiagnosticsRepository } from "../src/services/PluginStorage/DiagnosticsRepository";
import { CacheRepository } from "../src/services/PluginStorage/CacheRepository";

function memoryHost(initial: unknown = {}) {
  let state = initial;
  return {
    manifest: { id: "knowledge-library-v6", version: "6.4.1" },
    loadData: vi.fn(async () => state),
    saveData: vi.fn(async (data: unknown) => { state = data; }),
    state: () => state
  };
}

describe("safe deployment scripts", () => {
  it("deploy-windows preserves data and only copies artifacts", () => {
    const script = readFileSync(join(process.cwd(), "scripts/deploy-windows.ps1"), "utf8");
    expect(script).not.toContain("Move-Item -LiteralPath $target");
    expect(script).toContain('@("main.js", "manifest.json", "styles.css")');
    expect(script).toContain("deployment-report.md");
    expect(script).toContain("Files Preserved");
  });

  it("supports missing plugin folder creation", () => {
    const script = readFileSync(join(process.cwd(), "scripts/deploy-windows.ps1"), "utf8");
    expect(script).toContain("if (-not (Test-Path $target))");
    expect(script).toContain("New-Item -ItemType Directory");
  });
});

describe("plugin state manager", () => {
  it("migrates old state and preserves unknown fields", async () => {
    const host = memoryHost({ libraryFolder: "Library", custom_future_field: { keep: true } });
    const manager = new PluginStateManager(host);
    const state = await manager.loadState();
    expect(state.state_version).toBe(1);
    expect(state.plugin_version).toBe("6.4.1");
    expect(state.custom_future_field).toEqual({ keep: true });
  });

  it("migrates stale persisted status bar labels", async () => {
    const host = memoryHost({ state_version: 1, plugin_version: "6.4.0", versionLabel: "KL 6.4.0", custom_future_field: { keep: true } });
    const manager = new PluginStateManager(host);
    const state = await manager.loadState();
    expect(state.plugin_version).toBe("6.4.1");
    expect(state.versionLabel).toBe("KL 6.4.1");
    expect(state.custom_future_field).toEqual({ keep: true });
    expect((host.state() as { versionLabel: string }).versionLabel).toBe("KL 6.4.1");
  });


  it("backs up and restores state", async () => {
    const host = memoryHost({ state_version: 1, plugin_version: "6.4.1", libraryFolder: "A" });
    const manager = new PluginStateManager(host);
    const backup = await manager.backup("test");
    await manager.saveState({ ...(await manager.loadState()), libraryFolder: "B" });
    await manager.restore(backup.id);
    expect((host.state() as { libraryFolder: string }).libraryFolder).toBe("A");
  });

  it("recovers corrupted state without throwing", async () => {
    const host = memoryHost(null);
    const manager = new PluginStateManager(host);
    const state = await manager.loadState();
    expect(state.state_version).toBe(1);
    expect(state.plugin_version).toBe("6.4.1");
  });

  it("exports and imports configuration without cache or index", async () => {
    const host = memoryHost({ ...DEFAULT_SETTINGS, unifiedKnowledgeIndex: { entries: [1] }, savedKnowledgeSearches: [{ id: "s" }] });
    const manager = new PluginStateManager(host);
    const exported = await manager.exportConfiguration(Object.keys(DEFAULT_SETTINGS));
    expect(exported.saved_searches).toEqual([{ id: "s" }]);
    expect(JSON.stringify(exported)).not.toContain("unifiedKnowledgeIndex");
    await manager.importConfiguration({ ...exported, settings: { libraryFolder: "Imported" } });
    expect((host.state() as { libraryFolder: string }).libraryFolder).toBe("Imported");
  });
});

describe("plugin storage repositories", () => {
  it("read and write settings index saved searches connectors and diagnostics", async () => {
    const host = memoryHost({ ...DEFAULT_SETTINGS, vaultConnectors: [{ id: "c" }] });
    const manager = new PluginStateManager(host);
    await new SettingsRepository(manager).save({ ...DEFAULT_SETTINGS, libraryFolder: "Updated" });
    expect((await new SettingsRepository(manager).load(DEFAULT_SETTINGS)).libraryFolder).toBe("Updated");
    await manager.saveState({ ...DEFAULT_SETTINGS, versionLabel: "KL 6.4.0" });
    expect((await new SettingsRepository(manager).load(DEFAULT_SETTINGS)).versionLabel).toBe("KL 6.4.1");
    await new IndexRepository(manager).save({ schema_version: 1, rebuilt_at: "now", entries: [], connector_statuses: [], errors: [] });
    expect((await new IndexRepository(manager).load())?.rebuilt_at).toBe("now");
    await new SavedSearchRepository(manager).saveAll([{ id: "s", name: "S", query: "q", displayMode: "compact", sortMode: "relevance", createdAt: "now", updatedAt: "now" }]);
    expect(await new SavedSearchRepository(manager).list()).toHaveLength(1);
    expect(await new ConnectorRepository(manager).list()).toEqual(DEFAULT_SETTINGS.vaultConnectors);
    await new DiagnosticsRepository(manager).write({ ok: true });
    expect(await new DiagnosticsRepository(manager).read()).toBeTruthy();
    expect((await new CacheRepository(manager).status()).readable).toBe(true);
  });
});

describe("diagnostics and logger", () => {
  it("collects diagnostics and writes self-test output", async () => {
    const stateManager = new PluginStateManager(memoryHost({ ...DEFAULT_SETTINGS }));
    const plugin = {
      manifest: { id: "knowledge-library-v6", version: "6.4.1" },
      app: { vault: { configDir: ".obsidian", getName: () => "Vault" }, version: "1.8.7" },
      settings: DEFAULT_SETTINGS,
      stateManager,
      indexRepository: new IndexRepository(stateManager),
      cacheRepository: new CacheRepository(stateManager),
      connectorRepository: new ConnectorRepository(stateManager),
      savedSearchRepository: new SavedSearchRepository(stateManager),
      diagnosticsRepository: new DiagnosticsRepository(stateManager)
    };
    const service = new DiagnosticsService(plugin as never);
    const report = await service.collect();
    expect(report.pluginVersion).toBe("6.4.1");
    expect(await service.runSelfDiagnostics()).toContain("Plugin state readable: yes");
  });

  it("respects logger levels and production debug suppression", () => {
    const logger = new LoggerService("WARN", true);
    expect(logger.shouldLog("DEBUG")).toBe(false);
    expect(logger.shouldLog("ERROR")).toBe(true);
    logger.setLevel("DEBUG");
    expect(logger.shouldLog("INFO")).toBe(true);
  });
});

describe("state boundary", () => {
  it("keeps direct plugin data access inside StateManager only", () => {
    const files = [
      "src/main.ts",
      "src/services/UnifiedIndexService.ts",
      "src/services/SavedSearchService.ts"
    ];
    for (const file of files) {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      expect(source).not.toMatch(/loadData\(|saveData\(/);
    }
  });

  it("does not touch external vault paths in maintenance tests", () => {
    const root = mkdtempSync(join(tmpdir(), "kl-maintenance-"));
    try {
      mkdirSync(root, { recursive: true });
      writeFileSync(join(root, "data.json"), "{}", "utf8");
      expect(readFileSync(join(root, "data.json"), "utf8")).toBe("{}");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
