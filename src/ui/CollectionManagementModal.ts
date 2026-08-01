import { App, Modal, Notice } from "obsidian";
import { CollectionBulkPlan, CollectionService } from "../services/CollectionService";
import { StoredResource, VaultResourceRepository } from "../services/VaultResourceRepository";

export class CollectionManagementModal extends Modal {
  private resources: StoredResource[] = [];

  constructor(
    app: App,
    private readonly repository: VaultResourceRepository,
    private readonly collectionService: CollectionService,
    private readonly onChanged: () => Promise<void>
  ) {
    super(app);
  }

  async onOpen(): Promise<void> {
    this.contentEl.addClass("knowledge-library-collections-modal");
    await this.refresh();
  }

  private async refresh(): Promise<void> {
    this.resources = await this.repository.list();
    this.render();
  }

  private render(): void {
    this.contentEl.empty();
    this.contentEl.createEl("h2", { text: "Manage collections" });
    const list = this.contentEl.createDiv({ cls: "knowledge-library-management-list" });

    for (const item of this.collectionService.collectionCounts(this.resources)) {
      const row = list.createDiv({ cls: "knowledge-library-management-row" });
      row.createDiv({ text: item.name, cls: "knowledge-library-management-name" });
      row.createDiv({ text: `${item.count} item${item.count === 1 ? "" : "s"}`, cls: "knowledge-library-management-count" });
      const renameInput = row.createEl("input", { attr: { "aria-label": `Rename ${item.name}`, title: `Rename ${item.name}`, placeholder: "New name" } });
      const mergeInput = row.createEl("input", { attr: { "aria-label": `Merge ${item.name} into`, title: `Merge ${item.name} into`, placeholder: "Merge into" } });
      this.button(row, "Rename", `Rename ${item.name}`, () => void this.confirmPlan(this.collectionService.planRename(this.resources, item.name, renameInput.value)));
      this.button(row, "Merge", `Merge ${item.name}`, () => void this.confirmPlan(this.collectionService.planMerge(this.resources, [item.name], mergeInput.value)));
      this.button(row, "Remove", `Remove ${item.name} associations`, () => void this.confirmPlan(this.collectionService.planMerge(this.resources, [item.name], "")));
    }
  }

  private async confirmPlan(plan: CollectionBulkPlan): Promise<void> {
    if (!plan.to && plan.operation !== "merge") {
      new Notice("Collection name is required.");
      return;
    }

    const preview = plan.changes.map((change) => `${change.title}: ${change.before.join(", ")} -> ${change.after.join(", ") || "none"}`).join("\n");
    const confirmed = window.confirm(`${plan.operation === "rename" ? "Rename" : "Merge/remove"} collection?\n\n${preview || "No resources will change."}`);
    if (!confirmed) {
      return;
    }

    await this.collectionService.applyPlan(plan, this.repository);
    await this.writeReport(plan);
    await this.onChanged();
    await this.refresh();
  }

  private async writeReport(plan: CollectionBulkPlan): Promise<void> {
    const folder = "KnowledgeLibrary Reports";
    if (!this.app.vault.getAbstractFileByPath(folder)) {
      await this.app.vault.createFolder(folder);
    }
    const path = `${folder}/collection-${plan.operation}-${Date.now()}.md`;
    const lines = [`# Collection ${plan.operation} report`, "", `From: ${plan.from.join(", ")}`, `To: ${plan.to || "none"}`, "", "## Changes", "", ...plan.changes.map((change) => `- ${change.path}: ${change.before.join(", ")} -> ${change.after.join(", ") || "none"}`)];
    await this.app.vault.create(path, lines.join("\n"));
  }

  private button(parent: HTMLElement, text: string, ariaLabel: string, onClick: () => void): void {
    const button = parent.createEl("button", { text, cls: "knowledge-library-button", attr: { "aria-label": ariaLabel, title: ariaLabel } });
    button.addEventListener("click", onClick);
  }
}
