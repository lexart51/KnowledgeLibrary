import { App, Modal } from "obsidian";
import { TagReplacement, ThumbnailRepairItem, WriteOperationReport, WritePlanItem } from "../services/MaintenanceServices";

export class ConfirmationModal extends Modal {
  constructor(
    app: App,
    private readonly title: string,
    private readonly message: string,
    private readonly counts: Array<[string, number]>,
    private readonly onConfirm: () => Promise<void>
  ) {
    super(app);
  }

  onOpen(): void {
    this.contentEl.empty();
    this.contentEl.addClass("knowledge-library-confirm-modal");
    this.contentEl.createEl("h2", { text: this.title });
    this.contentEl.createEl("p", { text: this.message });
    const list = this.contentEl.createEl("ul");
    for (const [label, count] of this.counts) {
      list.createEl("li", { text: `${label}: ${count}` });
    }
    const actions = this.contentEl.createDiv({ cls: "knowledge-library-add-actions" });
    actions.createEl("button", { text: "Cancel" }).addEventListener("click", () => this.close());
    actions.createEl("button", { text: "Confirm", cls: "mod-warning" }).addEventListener("click", () => {
      void this.onConfirm().finally(() => this.close());
    });
  }
}

export class MaintenanceReportModal extends Modal {
  constructor(
    app: App,
    private readonly title: string,
    private readonly report: WriteOperationReport
  ) {
    super(app);
  }

  onOpen(): void {
    this.contentEl.empty();
    this.contentEl.addClass("knowledge-library-report");
    this.contentEl.createEl("h2", { text: this.title });
    this.contentEl.createEl("p", { text: `Dry run: ${this.report.dryRun}` });
    if (this.report.reportPath) {
      this.contentEl.createEl("p", { text: `Report note: ${this.report.reportPath}` });
    }
    this.renderList("Changed", this.report.changed.map((path) => ({ path, reason: "updated" })));
    this.renderList("Skipped", this.report.skipped);
    this.renderList("Failed", this.report.failed);
    this.renderList("Manual review", this.report.manualReview);
  }

  private renderList(title: string, items: WritePlanItem[]): void {
    this.contentEl.createEl("h3", { text: title });
    if (items.length === 0) {
      this.contentEl.createEl("p", { text: "None" });
      return;
    }
    const list = this.contentEl.createEl("ul");
    for (const item of items) {
      list.createEl("li", { text: `${item.path}: ${item.reason}` });
    }
  }
}

export class TagAnalysisModal extends Modal {
  constructor(
    app: App,
    private readonly replacements: TagReplacement[]
  ) {
    super(app);
  }

  onOpen(): void {
    this.contentEl.empty();
    this.contentEl.addClass("knowledge-library-report");
    this.contentEl.createEl("h2", { text: "Knowledge Library Tag Analysis" });
    this.contentEl.createEl("p", { text: `${this.replacements.length} note${this.replacements.length === 1 ? "" : "s"} need tag consolidation.` });
    const table = this.contentEl.createEl("table", { cls: "knowledge-library-report-table" });
    const head = table.createEl("thead").createEl("tr");
    for (const heading of ["Path", "Before", "After"]) {
      head.createEl("th", { text: heading });
    }
    const body = table.createEl("tbody");
    for (const item of this.replacements) {
      const row = body.createEl("tr");
      row.createEl("td", { text: item.path });
      row.createEl("td", { text: item.before.join(", ") });
      row.createEl("td", { text: item.after.join(", ") });
    }
  }
}

export class ThumbnailAnalysisModal extends Modal {
  constructor(
    app: App,
    private readonly items: ThumbnailRepairItem[]
  ) {
    super(app);
  }

  onOpen(): void {
    this.contentEl.empty();
    this.contentEl.addClass("knowledge-library-report");
    this.contentEl.createEl("h2", { text: "Knowledge Library Thumbnail Repair Preview" });
    this.contentEl.createEl("p", { text: `${this.items.length} YouTube thumbnail${this.items.length === 1 ? "" : "s"} can be repaired.` });
    const list = this.contentEl.createEl("ul");
    for (const item of this.items) {
      list.createEl("li", { text: `${item.path}: ${item.thumbnail}` });
    }
  }
}
