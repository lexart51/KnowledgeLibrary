import { App, Modal, Notice } from "obsidian";
import { AddResourceKind } from "../services/AddResourceService";
import KnowledgeLibraryPlugin from "../main";

const RESOURCE_TYPES: Array<{ value: AddResourceKind; label: string }> = [
  { value: "youtube", label: "YouTube" },
  { value: "website", label: "Website" },
  { value: "pdf", label: "PDF" },
  { value: "book", label: "Book" },
  { value: "powerpoint", label: "PowerPoint" },
  { value: "markdown", label: "Markdown" },
  { value: "image", label: "Image" },
  { value: "script", label: "Script" },
  { value: "skill", label: "Skill" },
  { value: "archive", label: "ZIP/Archive" },
  { value: "other", label: "Other" }
];

export class AddResourceModal extends Modal {
  private typeSelect!: HTMLSelectElement;
  private urlInput!: HTMLInputElement;
  private fileSelect!: HTMLSelectElement;
  private titleInput!: HTMLInputElement;
  private creatorInput!: HTMLInputElement;
  private tagsInput!: HTMLInputElement;
  private editionInput!: HTMLInputElement;
  private publisherInput!: HTMLInputElement;
  private isbnInput!: HTMLInputElement;
  private validationEl!: HTMLElement;
  private progressEl!: HTMLElement;
  private urlField!: HTMLElement;
  private fileField!: HTMLElement;
  private bookFields!: HTMLElement;
  private addButton!: HTMLButtonElement;

  constructor(
    app: App,
    private readonly plugin: KnowledgeLibraryPlugin
  ) {
    super(app);
  }

  onOpen(): void {
    this.contentEl.empty();
    this.contentEl.addClass("knowledge-library-add-modal");
    this.contentEl.createEl("h2", { text: "Add Resource" });

    const form = this.contentEl.createDiv({ cls: "knowledge-library-add-form" });
    this.typeSelect = this.createSelectField(form, "Type", RESOURCE_TYPES);
    this.urlField = form.createDiv({ cls: "knowledge-library-add-field" });
    this.urlInput = this.createInput(this.urlField, "URL");
    this.fileField = form.createDiv({ cls: "knowledge-library-add-field" });
    this.fileSelect = this.createFileSelect(this.fileField);
    this.titleInput = this.createInput(form.createDiv({ cls: "knowledge-library-add-field" }), "Title");
    this.creatorInput = this.createInput(form.createDiv({ cls: "knowledge-library-add-field" }), "Creator / Author");
    this.tagsInput = this.createTagInput(form.createDiv({ cls: "knowledge-library-add-field" }));

    this.bookFields = form.createDiv({ cls: "knowledge-library-add-book-fields" });
    this.editionInput = this.createInput(this.bookFields.createDiv({ cls: "knowledge-library-add-field" }), "Edition");
    this.publisherInput = this.createInput(this.bookFields.createDiv({ cls: "knowledge-library-add-field" }), "Publisher");
    this.isbnInput = this.createInput(this.bookFields.createDiv({ cls: "knowledge-library-add-field" }), "ISBN");

    this.validationEl = this.contentEl.createDiv({ cls: "knowledge-library-add-validation" });
    this.progressEl = this.contentEl.createDiv({ cls: "knowledge-library-add-progress" });

    const actions = this.contentEl.createDiv({ cls: "knowledge-library-add-actions" });
    const cancelButton = actions.createEl("button", { text: "Cancel" });
    cancelButton.addEventListener("click", () => this.close());
    this.addButton = actions.createEl("button", { text: "Add", cls: "mod-cta" });
    this.addButton.addEventListener("click", () => void this.submit());

    this.typeSelect.addEventListener("change", () => this.renderConditionalFields());
    this.renderConditionalFields();
  }

  private createSelectField(parent: HTMLElement, labelText: string, options: Array<{ value: string; label: string }>): HTMLSelectElement {
    const label = parent.createEl("label", { cls: "knowledge-library-add-field" });
    label.createSpan({ text: labelText });
    const select = label.createEl("select");
    for (const option of options) {
      select.createEl("option", { text: option.label, value: option.value });
    }
    return select;
  }

  private createInput(parent: HTMLElement, labelText: string): HTMLInputElement {
    parent.createEl("span", { text: labelText });
    const input = parent.createEl("input");
    input.type = "text";
    return input;
  }

  private createTagInput(parent: HTMLElement): HTMLInputElement {
    parent.createEl("span", { text: "Tags" });
    const listId = "knowledge-library-tag-options";
    const input = parent.createEl("input", { attr: { list: listId, placeholder: this.plugin.settings.defaultTag } });
    const datalist = parent.createEl("datalist", { attr: { id: listId } });
    for (const tag of this.plugin.addResourceService.getExistingCanonicalTags()) {
      datalist.createEl("option", { value: tag });
    }
    return input;
  }

  private createFileSelect(parent: HTMLElement): HTMLSelectElement {
    parent.createEl("span", { text: "Vault file" });
    const select = parent.createEl("select");
    select.createEl("option", { text: "Select a file", value: "" });
    for (const file of this.app.vault.getFiles().sort((left, right) => left.path.localeCompare(right.path))) {
      select.createEl("option", { text: file.path, value: file.path });
    }
    return select;
  }

  private renderConditionalFields(): void {
    const kind = this.typeSelect.value as AddResourceKind;
    const needsUrl = kind === "youtube" || kind === "website" || kind === "book";
    const needsFile = kind !== "youtube" && kind !== "website";
    this.urlField.toggleClass("is-hidden", !needsUrl);
    this.fileField.toggleClass("is-hidden", !needsFile);
    this.bookFields.toggleClass("is-hidden", kind !== "book");
  }

  private async submit(): Promise<void> {
    this.validationEl.setText("");
    this.progressEl.setText("Fetching metadata...");
    this.addButton.disabled = true;

    try {
      const result = await this.plugin.addResourceFromWizard({
        kind: this.typeSelect.value as AddResourceKind,
        url: this.urlInput.value,
        filePath: this.fileSelect.value,
        title: this.titleInput.value,
        creator: this.creatorInput.value,
        tags: [this.tagsInput.value],
        edition: this.editionInput.value,
        publisher: this.publisherInput.value,
        isbn: this.isbnInput.value
      });
      new Notice(result.duplicate ? "Resource already exists. Opened existing note." : "Resource added.");
      this.close();
    } catch (error) {
      this.validationEl.setText(error instanceof Error ? error.message : "Unable to add resource.");
    } finally {
      this.progressEl.setText("");
      this.addButton.disabled = false;
    }
  }
}
