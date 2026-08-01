import { ItemView, Notice, WorkspaceLeaf } from "obsidian";
import { KNOWLEDGE_DIAGNOSTICS_VIEW_TYPE } from "../core/viewTypes";
import KnowledgeLibraryPlugin from "../main";

export class DiagnosticsView extends ItemView {
  constructor(leaf: WorkspaceLeaf, private readonly plugin: KnowledgeLibraryPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return KNOWLEDGE_DIAGNOSTICS_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Knowledge Library Diagnostics";
  }

  async onOpen(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.contentEl.empty();
    this.contentEl.addClass("knowledge-library-diagnostics-view");
    this.contentEl.createEl("h2", { text: "Knowledge Library Diagnostics" });
    const report = await this.plugin.diagnosticsService.collect();
    const grid = this.contentEl.createDiv({ cls: "knowledge-library-dashboard-grid" });
    for (const [key, value] of Object.entries(report)) {
      const metric = grid.createDiv({ cls: "knowledge-library-report-metric" });
      metric.createSpan({ text: label(key) });
      metric.createEl("strong", { text: String(value ?? "") });
    }
    const actions = this.contentEl.createDiv({ cls: "knowledge-library-view-actions" });
    const copy = actions.createEl("button", { text: "Copy diagnostics", cls: "knowledge-library-button mod-cta", attr: { "aria-label": "Copy diagnostics", title: "Copy diagnostics" } });
    copy.addEventListener("click", () => {
      void navigator.clipboard.writeText(this.plugin.diagnosticsService.format(report)).then(() => new Notice("Diagnostics copied."));
    });
  }
}

function label(value: string): string {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}
