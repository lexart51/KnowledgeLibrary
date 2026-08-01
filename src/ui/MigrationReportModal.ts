import { App, Modal } from "obsidian";
import { labelForLegacyKind, MigrationReport } from "../services/MigrationService";

type ReportMode = "audit" | "simulation";

export class MigrationReportModal extends Modal {
  constructor(
    app: App,
    private readonly report: MigrationReport,
    private readonly mode: ReportMode
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("knowledge-library-report");
    contentEl.createEl("h2", { text: this.mode === "audit" ? "Knowledge Library Vault Analysis" : "Knowledge Library Migration Simulation" });
    contentEl.createEl("p", { text: `Generated ${this.report.generatedAt}` });

    if (this.mode === "audit") {
      this.renderAudit(contentEl);
    } else {
      this.renderSimulation(contentEl);
    }
  }

  private renderAudit(parent: HTMLElement): void {
    const audit = this.report.audit;
    const summary = parent.createDiv({ cls: "knowledge-library-report-summary" });
    this.metric(summary, "Total resources", audit.totalResources);
    this.metric(summary, "Duplicated ids", audit.duplicatedIds.length);
    this.metric(summary, "Duplicated YouTube ids", audit.duplicatedYouTubeIds.length);
    this.metric(summary, "Missing thumbnails", audit.missingThumbnails.length);
    this.metric(summary, "Unavailable resources", audit.unavailableResources.length);
    this.metric(summary, "Orphan notes", audit.orphanNotes.length);
    this.metric(summary, "Legacy fields still present", audit.legacyFieldsStillPresent.length);
    this.metric(summary, "Invalid YAML", audit.invalidYaml.length);
    this.metric(summary, "Invalid URLs", audit.invalidUrls.length);

    this.list(parent, "Duplicated ids", audit.duplicatedIds);
    this.list(parent, "Duplicated YouTube ids", audit.duplicatedYouTubeIds);
    this.list(parent, "Missing thumbnails", audit.missingThumbnails);
    this.list(parent, "Unavailable resources", audit.unavailableResources);
    this.list(parent, "Orphan notes", audit.orphanNotes);
    this.list(parent, "Invalid YAML", audit.invalidYaml);
    this.list(parent, "Invalid URLs", audit.invalidUrls);

    const legacy = audit.legacyFieldsStillPresent.map((item) => `${item.path}: ${item.fields.join(", ")}`);
    this.list(parent, "Legacy fields still present", legacy);
  }

  private renderSimulation(parent: HTMLElement): void {
    const simulation = this.report.simulation;
    const summary = parent.createDiv({ cls: "knowledge-library-report-summary" });
    this.metric(summary, "Resources detected", simulation.resourcesDetected.length);
    this.metric(summary, "Resources ignored", simulation.resourcesIgnored.length);
    this.metric(summary, "Would be converted", simulation.resourcesThatWouldBeConverted.length);
    this.metric(summary, "Manual review", simulation.resourcesRequiringManualReview.length);

    this.table(parent, "Resources detected", ["Path", "Format", "Title"], simulation.resourcesDetected.map((record) => [
      record.path,
      labelForLegacyKind(record.kind),
      record.resource?.title ?? ""
    ]));
    this.table(parent, "Resources ignored", ["Path", "Reason"], simulation.resourcesIgnored.map((record) => [record.path, record.reason]));
    this.table(parent, "Resources that would be converted", ["Path", "Type", "Title"], simulation.resourcesThatWouldBeConverted.map((record) => [
      record.path,
      record.resource?.type ?? "",
      record.resource?.title ?? ""
    ]));
    this.table(parent, "Resources requiring manual review", ["Path", "Reasons"], simulation.resourcesRequiringManualReview.map((record) => [
      record.path,
      record.reasons.join(", ")
    ]));
  }

  private metric(parent: HTMLElement, label: string, value: number): void {
    const item = parent.createDiv({ cls: "knowledge-library-report-metric" });
    item.createSpan({ text: label });
    item.createEl("strong", { text: String(value) });
  }

  private list(parent: HTMLElement, title: string, values: string[]): void {
    parent.createEl("h3", { text: title });
    if (values.length === 0) {
      parent.createEl("p", { text: "None" });
      return;
    }

    const list = parent.createEl("ul");
    for (const value of values) {
      list.createEl("li", { text: value });
    }
  }

  private table(parent: HTMLElement, title: string, headings: string[], rows: string[][]): void {
    parent.createEl("h3", { text: title });
    if (rows.length === 0) {
      parent.createEl("p", { text: "None" });
      return;
    }

    const table = parent.createEl("table", { cls: "knowledge-library-report-table" });
    const header = table.createEl("thead").createEl("tr");
    for (const heading of headings) {
      header.createEl("th", { text: heading });
    }

    const body = table.createEl("tbody");
    for (const row of rows) {
      const tr = body.createEl("tr");
      for (const cell of row) {
        tr.createEl("td", { text: cell });
      }
    }
  }
}
