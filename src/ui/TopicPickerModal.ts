import { App, Modal, Notice } from "obsidian";
import { TopicSummary, topicId } from "../services/TopicService";

export interface TopicPickerOption {
  topic: TopicSummary;
  label: string;
  aliases: string[];
  sourceSummary: string;
}

export class TopicPickerModal extends Modal {
  private query = "";
  private selectedIndex = 0;
  private inputEl!: HTMLInputElement;
  private resultsEl!: HTMLElement;

  constructor(app: App, private readonly topics: TopicSummary[], private readonly onChooseTopic: (topicName: string) => void | Promise<void>, private readonly onOpened: (() => void) | null = null) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass("knowledge-library-topic-picker-modal");
    this.containerEl.addClass("mod-knowledge-library-topic-picker");
    this.onOpened?.();
    this.contentEl.empty();
    this.contentEl.addClass("knowledge-library-topic-picker");
    this.contentEl.createEl("h2", { text: "Open Topic" });

    this.inputEl = this.contentEl.createEl("input", {
      type: "search",
      cls: "knowledge-library-topic-picker-search",
      attr: {
        placeholder: "Search topics...",
        "aria-label": "Search topics"
      }
    });
    this.resultsEl = this.contentEl.createDiv({ cls: "knowledge-library-topic-picker-results" });

    this.inputEl.addEventListener("input", () => {
      this.query = this.inputEl.value;
      this.selectedIndex = 0;
      this.renderResults();
    });
    this.inputEl.addEventListener("keydown", (event) => this.handleKeydown(event));
    this.renderResults();
    window.setTimeout(() => this.inputEl.focus(), 0);
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private handleKeydown(event: KeyboardEvent): void {
    const results = filterTopicPickerOptions(this.topics, this.query);
    if (event.key === "Escape") {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.selectedIndex = nextTopicPickerIndex(this.selectedIndex, 1, results.length);
      this.renderResults();
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      this.selectedIndex = nextTopicPickerIndex(this.selectedIndex, -1, results.length);
      this.renderResults();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const selected = results[this.selectedIndex];
      if (!selected) {
        new Notice("No matching topic found.");
        return;
      }
      this.choose(selected.topic.name);
    }
  }

  private renderResults(): void {
    this.resultsEl.empty();
    const results = filterTopicPickerOptions(this.topics, this.query);
    if (results.length === 0) {
      this.resultsEl.createDiv({ text: "No matching topic found.", cls: "knowledge-library-empty-state" });
      return;
    }
    this.selectedIndex = Math.min(this.selectedIndex, results.length - 1);
    results.forEach((option, index) => {
      const row = this.resultsEl.createEl("button", {
        cls: `knowledge-library-topic-picker-row${index === this.selectedIndex ? " is-selected" : ""}`,
        attr: {
          "aria-label": `Open topic ${option.label}`,
          title: `Open topic ${option.label}`
        }
      });
      row.createSpan({ text: option.label, cls: "knowledge-library-result-title" });
      row.createSpan({ text: `${option.topic.entries.length} logical item${option.topic.entries.length === 1 ? "" : "s"} | ${option.sourceSummary}`, cls: "knowledge-library-result-meta" });
      row.addEventListener("mousemove", () => {
        this.selectedIndex = index;
        this.renderResults();
      });
      row.addEventListener("click", () => this.choose(option.topic.name));
    });
  }

  private choose(topicName: string): void {
    this.close();
    void Promise.resolve(this.onChooseTopic(topicName)).catch((error) => new Notice(error instanceof Error ? error.message : "Unable to open topic page."));
  }
}

export function filterTopicPickerOptions(topics: TopicSummary[], query: string, limit = 30): TopicPickerOption[] {
  const normalizedQuery = topicId(query);
  const textQuery = query.trim().toLowerCase();
  return topics
    .map((topic) => ({ topic, label: topic.name, aliases: topic.aliases, sourceSummary: describeTopicSources(topic) }))
    .filter((option) => {
      if (!normalizedQuery && !textQuery) return true;
      return topicId(option.label).includes(normalizedQuery)
        || option.label.toLowerCase().includes(textQuery)
        || option.aliases.some((alias) => topicId(alias).includes(normalizedQuery) || alias.toLowerCase().includes(textQuery));
    })
    .slice(0, limit);
}

export function describeTopicSources(topic: TopicSummary): string {
  const parts = [
    topic.counts.videos > 0 ? `${topic.counts.videos} video${topic.counts.videos === 1 ? "" : "s"}` : "",
    topic.counts.conversations > 0 ? `${topic.counts.conversations} conversation${topic.counts.conversations === 1 ? "" : "s"}` : "",
    topic.counts.documents > 0 ? `${topic.counts.documents} document${topic.counts.documents === 1 ? "" : "s"}` : "",
    topic.counts.resources > 0 ? `${topic.counts.resources} resource${topic.counts.resources === 1 ? "" : "s"}` : ""
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "No indexed items";
}

export function nextTopicPickerIndex(current: number, delta: number, length: number): number {
  if (length <= 0) return 0;
  return (current + delta + length) % length;
}