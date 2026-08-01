import { App, Modal, Notice } from "obsidian";
import KnowledgeLibraryPlugin from "../main";
import { UnifiedIndexEntry, UnifiedKnowledgeIndex } from "../models/VaultConnector";
import { UnifiedSearchService } from "../services/UnifiedIndexService";

export class UnifiedSearchModal extends Modal {
  private searchService = new UnifiedSearchService();
  private index: UnifiedKnowledgeIndex | null = null;
  private query = "";
  private resultsEl!: HTMLElement;

  constructor(app: App, private readonly plugin: KnowledgeLibraryPlugin) {
    super(app);
  }

  async onOpen(): Promise<void> {
    this.contentEl.addClass("knowledge-library-unified-search-modal");
    this.index = await this.plugin.unifiedIndexService.load() ?? await this.plugin.unifiedIndexService.rebuild();
    this.render();
  }

  private render(): void {
    this.contentEl.empty();
    this.contentEl.createEl("h2", { text: "Search connected vaults" });
    const input = this.contentEl.createEl("input", { cls: "knowledge-library-search", attr: { "aria-label": "Search all connected vaults", title: "Search all connected vaults", placeholder: "Search title, tags, excerpt, platform, connector, vault, type" } });
    input.type = "search";
    input.value = this.query;
    input.addEventListener("input", () => {
      this.query = input.value;
      this.renderResults();
    });
    this.resultsEl = this.contentEl.createDiv({ cls: "knowledge-library-unified-results" });
    this.renderResults();
  }

  private renderResults(): void {
    this.resultsEl.empty();
    const results = this.index ? this.searchService.search(this.index, this.query) : [];
    for (const entry of results.slice(0, 100)) {
      const row = this.resultsEl.createDiv({ cls: "knowledge-library-unified-result" });
      row.createDiv({ text: entry.title, cls: "knowledge-library-management-name" });
      const badges = row.createDiv({ cls: "knowledge-library-card-badge-row" });
      badges.createSpan({ text: entry.connector_name, cls: "knowledge-library-source-badge" });
      badges.createSpan({ text: entry.vault_name, cls: "knowledge-library-external-badge" });
      badges.createSpan({ text: entry.type, cls: "knowledge-library-type-badge" });
      row.createDiv({ text: entry.excerpt, cls: "knowledge-library-card-meta" });
      const button = row.createEl("button", { text: "Open", cls: "knowledge-library-button", attr: { "aria-label": `Open ${entry.title}`, title: `Open ${entry.title}` } });
      button.addEventListener("click", () => this.openEntry(entry));
    }
  }

  private openEntry(entry: UnifiedIndexEntry): void {
    if (entry.open_uri.startsWith("obsidian://")) {
      window.open(entry.open_uri, "_blank");
      return;
    }
    new Notice(entry.open_uri || entry.path);
  }
}


