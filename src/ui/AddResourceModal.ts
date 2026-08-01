import { App, Modal, Notice, TFile } from "obsidian";
import { AddResourceKind } from "../services/AddResourceService";
import { FileResourceService } from "../services/FileResourceService";
import KnowledgeLibraryPlugin from "../main";

const RESOURCE_TYPES: Array<{ value: AddResourceKind; label: string }> = [
  { value: "youtube", label: "YouTube" },
  { value: "website", label: "Website" },
  { value: "pdf", label: "PDF" },
  { value: "book", label: "Book" },
  { value: "powerpoint", label: "PowerPoint" },
  { value: "document", label: "Word/Text Document" },
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
  private fileSearchInput!: HTMLInputElement;
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
    private readonly plugin: KnowledgeLibraryPlugin,
    private readonly initialFilePath: string | null = null
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
    this.fileSelect.addEventListener("change", () => this.detectSelectedFileType());
    this.applyInitialFilePath();
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
    this.fileSearchInput = parent.createEl("input", { attr: { placeholder: "Search filename or folder" } });
    this.fileSearchInput.type = "search";
    const select = parent.createEl("select");
    this.fileSearchInput.addEventListener("input", () => this.populateFileSelect(select, this.fileSearchInput.value));
    this.populateFileSelect(select, "");
    return select;
  }

  private populateFileSelect(select: HTMLSelectElement, search: string): void {
    const selected = select.value || this.initialFilePath || "";
    select.empty();
    select.createEl("option", { text: "Select a file", value: "" });
    for (const file of FileResourceService.filterVaultFiles(this.app.vault.getFiles(), this.plugin.settings, search)) {
      select.createEl("option", { text: file.path, value: file.path });
    }
    if (selected && Array.from(select.options).some((option) => option.value === selected)) {
      select.value = selected;
    }
  }

  private applyInitialFilePath(): void {
    if (!this.initialFilePath) {
      return;
    }

    const normalizedPath = FileResourceService.normalizeVaultPath(this.initialFilePath);
    const file = this.app.vault.getAbstractFileByPath(normalizedPath);
    if (!(file instanceof TFile) || !FileResourceService.isAllowedFile(file, this.plugin.settings)) {
      this.validationEl?.setText("Selected file is outside the allowed vault file set.");
      return;
    }

    this.fileSearchInput.value = normalizedPath;
    this.populateFileSelect(this.fileSelect, normalizedPath);
    this.fileSelect.value = normalizedPath;
    this.detectSelectedFileType();
  }

  private detectSelectedFileType(): void {
    const selected = this.fileSelect.value;
    if (!selected) {
      return;
    }

    const detectedType = FileResourceService.detectType(selected, undefined, this.plugin.settings.defaultUnknownFileType);
    if (RESOURCE_TYPES.some((item) => item.value === detectedType)) {
      this.typeSelect.value = detectedType;
      this.renderConditionalFields();
    }

    if (!this.titleInput.value.trim()) {
      this.titleInput.value = FileResourceService.filenameFromPath(selected).replace(/\.[^.]+$/, "");
    }
  }

  private renderConditionalFields(): void {
    const kind = this.typeSelect.value as AddResourceKind;
    const needsUrl = kind === "youtube" || kind === "website" || (kind === "book" && !this.fileSelect.value);
    const needsFile = kind !== "youtube" && kind !== "website" && !needsUrl;
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
