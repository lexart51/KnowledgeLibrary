import { App, Modal, Notice } from "obsidian";
import KnowledgeLibraryPlugin from "../main";
import { SavedKnowledgeSearch } from "../services/SearchRankingService";

export class SavedSearchManagementModal extends Modal {
  private searches: SavedKnowledgeSearch[] = [];

  constructor(app: App, private readonly plugin: KnowledgeLibraryPlugin) {
    super(app);
  }

  async onOpen(): Promise<void> {
    this.contentEl.addClass("knowledge-library-saved-searches-modal");
    this.searches = await this.plugin.savedSearchService.list();
    this.render();
  }

  private render(): void {
    this.contentEl.empty();
    this.contentEl.createEl("h2", { text: "Saved searches" });
    if (this.searches.length === 0) {
      this.contentEl.createDiv({ text: "No saved searches yet.", cls: "knowledge-library-empty-state" });
    }
    const list = this.contentEl.createDiv({ cls: "knowledge-library-unified-results" });
    for (const search of this.searches) {
      const row = list.createDiv({ cls: "knowledge-library-unified-result" });
      row.createDiv({ text: search.name, cls: "knowledge-library-management-name" });
      row.createDiv({ text: `${search.query} | ${search.displayMode} | ${search.sortMode}`, cls: "knowledge-library-result-meta" });
      const actions = row.createDiv({ cls: "knowledge-library-unified-result-actions" });
      this.button(actions, "Open", `Open saved search ${search.name}`, () => {
        this.close();
        void this.plugin.openUniversalSearch(search.query);
      });
      this.button(actions, "Delete", `Delete saved search ${search.name}`, () => void this.deleteSearch(search.id));
    }
    const footer = this.contentEl.createDiv({ cls: "knowledge-library-add-actions" });
    this.button(footer, "Close", "Close saved searches", () => this.close());
  }

  private async deleteSearch(id: string): Promise<void> {
    await this.plugin.savedSearchService.remove(id);
    this.searches = await this.plugin.savedSearchService.list();
    new Notice("Saved search removed.");
    this.render();
  }

  private button(parent: HTMLElement, text: string, ariaLabel: string, onClick: () => void): void {
    const button = parent.createEl("button", { text, cls: "knowledge-library-button", attr: { "aria-label": ariaLabel, title: ariaLabel } });
    button.addEventListener("click", onClick);
  }
}
