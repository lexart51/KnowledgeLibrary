import { App, Modal, Notice } from "obsidian";
import KnowledgeLibraryPlugin from "../main";
import { VaultConnector, VaultConnectorRole } from "../models/VaultConnector";
import { VaultAvailabilityService, VaultConnectorService, createConnectorId } from "../services/VaultConnectorService";

export class VaultConnectorManagementModal extends Modal {
  private connectorService = new VaultConnectorService();
  private availabilityService = new VaultAvailabilityService(this.connectorService);

  constructor(app: App, private readonly plugin: KnowledgeLibraryPlugin) {
    super(app);
  }

  onOpen(): void {
    this.contentEl.addClass("knowledge-library-connectors-modal");
    this.render();
  }

  private render(): void {
    this.contentEl.empty();
    this.contentEl.createEl("h2", { text: "Vault connectors" });
    const list = this.contentEl.createDiv({ cls: "knowledge-library-management-list" });
    for (const connector of this.plugin.settings.vaultConnectors) {
      this.renderConnector(list, connector);
    }
    const actions = this.contentEl.createDiv({ cls: "knowledge-library-add-actions" });
    this.button(actions, "Add connector", "Add vault connector", () => void this.addConnector());
    this.button(actions, "Close", "Close connector manager", () => this.close());
  }

  private renderConnector(parent: HTMLElement, connector: VaultConnector): void {
    const normalized = this.connectorService.normalizeConnector(connector);
    const status = this.availabilityService.check(normalized);
    const row = parent.createDiv({ cls: "knowledge-library-connector-row" });
    const enabled = row.createEl("input", { attr: { "aria-label": `Enable ${normalized.displayName}`, title: `Enable ${normalized.displayName}` } });
    enabled.type = "checkbox";
    enabled.checked = normalized.enabled;
    enabled.addEventListener("change", () => void this.updateConnector(normalized.id, { enabled: enabled.checked }));
    this.input(row, "Name", normalized.displayName, (value) => void this.updateConnector(normalized.id, { displayName: value, id: normalized.id || createConnectorId(value) }));
    this.select(row, "Role", normalized.role, ["resources", "conversations", "documents", "custom"], (value) => void this.updateConnector(normalized.id, { role: value as VaultConnectorRole }));
    this.input(row, "Windows path", normalized.windowsPath, (value) => void this.updateConnector(normalized.id, { windowsPath: value }));
    this.input(row, "Linux path", normalized.linuxPath ?? "", (value) => void this.updateConnector(normalized.id, { linuxPath: value }));
    this.input(row, "Vault name", normalized.vaultName ?? normalized.displayName, (value) => void this.updateConnector(normalized.id, { vaultName: value }));
    this.input(row, "Include", normalized.includePatterns.join(", "), (value) => void this.updateConnector(normalized.id, { includePatterns: parseCsv(value) }));
    this.input(row, "Exclude", normalized.excludePatterns.join(", "), (value) => void this.updateConnector(normalized.id, { excludePatterns: parseCsv(value) }));
    this.input(row, "Note type", normalized.preferredNoteType, (value) => void this.updateConnector(normalized.id, { preferredNoteType: value }));
    this.input(row, "Icon", normalized.icon, (value) => void this.updateConnector(normalized.id, { icon: value }));
    this.input(row, "Color", normalized.colorToken, (value) => void this.updateConnector(normalized.id, { colorToken: value }));
    row.createDiv({ cls: "knowledge-library-connector-status", text: `${status.available ? "Available" : "Unavailable"}: ${status.error ?? status.vaultName}` });
    this.button(row, "Test", `Test ${normalized.displayName}`, () => new Notice(status.available ? `Available: ${status.vaultName}` : status.error ?? "Unavailable"));
    this.button(row, "Remove config", `Remove ${normalized.displayName} connector configuration`, () => void this.removeConnector(normalized.id));
  }

  private async addConnector(): Promise<void> {
    this.plugin.settings.vaultConnectors.push({
      id: `connector-${Date.now()}`,
      displayName: "New connector",
      role: "custom",
      windowsPath: "",
      linuxPath: "",
      vaultName: "",
      enabled: false,
      includePatterns: ["**/*.md"],
      excludePatterns: [],
      preferredNoteType: "custom",
      icon: "database",
      colorToken: "var(--text-muted)",
      defaultCollections: [],
      enableDefaultCollections: false,
      lastScanAt: null,
      lastError: null
    });
    await this.plugin.saveSettings();
    this.render();
  }

  private async updateConnector(id: string, patch: Partial<VaultConnector>): Promise<void> {
    this.plugin.settings.vaultConnectors = this.plugin.settings.vaultConnectors.map((connector) => connector.id === id ? this.connectorService.normalizeConnector({ ...connector, ...patch }) : connector);
    await this.plugin.saveSettings();
  }

  private async removeConnector(id: string): Promise<void> {
    if (!window.confirm("Remove this connector configuration? No files will be deleted.")) {
      return;
    }
    this.plugin.settings.vaultConnectors = this.plugin.settings.vaultConnectors.filter((connector) => connector.id !== id);
    await this.plugin.saveSettings();
    this.render();
  }

  private input(parent: HTMLElement, labelText: string, value: string, onChange: (value: string) => void): void {
    const label = parent.createEl("label", { cls: "knowledge-library-add-field" });
    label.createSpan({ text: labelText });
    const input = label.createEl("input", { attr: { "aria-label": labelText, title: labelText } });
    input.value = value;
    input.addEventListener("change", () => onChange(input.value));
  }

  private select(parent: HTMLElement, labelText: string, value: string, options: string[], onChange: (value: string) => void): void {
    const label = parent.createEl("label", { cls: "knowledge-library-add-field" });
    label.createSpan({ text: labelText });
    const select = label.createEl("select", { attr: { "aria-label": labelText, title: labelText } });
    for (const option of options) select.createEl("option", { text: option, value: option });
    select.value = value;
    select.addEventListener("change", () => onChange(select.value));
  }

  private button(parent: HTMLElement, text: string, ariaLabel: string, onClick: () => void): void {
    const button = parent.createEl("button", { text, cls: "knowledge-library-button", attr: { "aria-label": ariaLabel, title: ariaLabel } });
    button.addEventListener("click", onClick);
  }
}

function parseCsv(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}
