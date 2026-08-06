import { App, Modal, Notice, TFile } from "obsidian";
import { AddResourceKind, AddResourceRequest } from "../services/AddResourceService";
import { KnowledgeResourceProgressUnit } from "../models/KnowledgeResource";
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

type ValidationKey = "url" | "filePath" | "title" | "tags" | "progress" | "global";

interface AddResourceFormState {
  kind: AddResourceKind;
  url: string;
  filePath: string;
  title: string;
  creator: string;
  tags: string;
  collections: string;
  priority: "low" | "normal" | "high";
  progress: string;
  progressUnit: KnowledgeResourceProgressUnit;
  currentPosition: string;
  totalUnits: string;
  notes: string;
  manualMetadata: boolean;
  publisher: string;
  edition: string;
  isbn: string;
  category: string;
  presentationDate: string;
  documentDate: string;
  sourceProject: string;
  description: string;
  language: string;
  project: string;
  entryPoint: string;
  platform: string;
  version: string;
  archiveFormat: string;
  resourceSubtype: string;
}

const INITIAL_STATE: AddResourceFormState = {
  kind: "youtube",
  url: "",
  filePath: "",
  title: "",
  creator: "",
  tags: "",
  collections: "",
  priority: "normal",
  progress: "0",
  progressUnit: "percent",
  currentPosition: "",
  totalUnits: "",
  notes: "",
  manualMetadata: false,
  publisher: "",
  edition: "",
  isbn: "",
  category: "",
  presentationDate: "",
  documentDate: "",
  sourceProject: "",
  description: "",
  language: "",
  project: "",
  entryPoint: "",
  platform: "",
  version: "",
  archiveFormat: "",
  resourceSubtype: ""
};

const FILE_BASED_TYPES = new Set<AddResourceKind>(["pdf", "powerpoint", "document", "markdown", "image", "script", "skill", "archive"]);

function isAddResourceKind(value: string): value is AddResourceKind {
  return RESOURCE_TYPES.some((type) => type.value === value);
}

export class AddResourceModal extends Modal {
  private state: AddResourceFormState = { ...INITIAL_STATE };
  private formEl!: HTMLElement;
  private validationEls = new Map<ValidationKey, HTMLElement>();
  private addButton!: HTMLButtonElement;

  constructor(
    app: App,
    private readonly plugin: KnowledgeLibraryPlugin,
    private readonly initialFilePath: string | null = null
  ) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass("knowledge-library-add-modal-shell");
    this.contentEl.empty();
    this.contentEl.addClass("knowledge-library-add-modal");
    this.contentEl.createEl("h2", { text: "Add Resource" });

    if (this.initialFilePath) {
      this.applyInitialFilePath(this.initialFilePath);
    }

    this.render();
  }

  private render(): void {
    this.validationEls.clear();
    this.formEl?.remove();
    this.formEl = this.contentEl.createDiv({ cls: `knowledge-library-add-form knowledge-library-specialized-form is-${this.state.kind}`, attr: { "data-resource-type": this.state.kind } });

    this.renderTypeSelector(this.formEl);
    this.renderSpecializedFields(this.formEl);
    this.renderCommonFields(this.formEl);
    this.renderValidation(this.formEl, "global", "knowledge-library-add-validation");
    this.renderActions(this.formEl);
    this.updateValidation();
  }

  private renderTypeSelector(parent: HTMLElement): void {
    const select = this.renderSelect(parent, "Type", "kind", RESOURCE_TYPES, "Choose resource type", "knowledge-library-type-field");
    select.addEventListener("change", () => {
      this.switchType(select.value as AddResourceKind);
    });
  }

  private renderSpecializedFields(parent: HTMLElement): void {
    switch (this.state.kind) {
      case "youtube":
        this.renderUrlField(parent, "YouTube URL", "Paste a YouTube URL");
        this.renderManualMetadataDisclosure(parent, "Edit metadata manually", [
          ["Title", "title", "Video title"],
          ["Creator", "creator", "Channel or creator"]
        ]);
        break;
      case "website":
        this.renderUrlField(parent, "Website URL", "Paste a website URL");
        this.renderManualMetadataDisclosure(parent, "Edit metadata manually", [
          ["Title", "title", "Page title"],
          ["Creator / Publisher", "creator", "Creator or publisher"]
        ]);
        break;
      case "pdf":
        this.renderFilePicker(parent);
        this.renderTextInput(parent, "Title", "title", "PDF title");
        this.renderTextInput(parent, "Author", "creator", "PDF author");
        this.renderTextInput(parent, "Category / Subject", "category", "PDF category or subject");
        break;
      case "book":
        this.renderBookSourceFields(parent);
        this.renderTextInput(parent, "Title", "title", "Book title");
        this.renderTextInput(parent, "Author", "creator", "Book author");
        this.renderTextInput(parent, "Publisher", "publisher", "Book publisher");
        this.renderTextInput(parent, "Edition", "edition", "Book edition");
        this.renderTextInput(parent, "ISBN", "isbn", "Book ISBN");
        break;
      case "powerpoint":
        this.renderFilePicker(parent);
        this.renderTextInput(parent, "Title", "title", "Presentation title");
        this.renderTextInput(parent, "Author / Organization", "creator", "Presentation author or organization");
        this.renderTextInput(parent, "Presentation date", "presentationDate", "Presentation date");
        break;
      case "document":
        this.renderFilePicker(parent);
        this.renderTextInput(parent, "Title", "title", "Document title");
        this.renderTextInput(parent, "Author / Organization", "creator", "Document author or organization");
        this.renderTextInput(parent, "Document date", "documentDate", "Document date");
        break;
      case "markdown":
        this.renderFilePicker(parent);
        this.renderTextInput(parent, "Title", "title", "Markdown title");
        this.renderTextInput(parent, "Author", "creator", "Markdown author");
        this.renderTextInput(parent, "Source / Project", "sourceProject", "Source or project");
        break;
      case "image":
        this.renderFilePicker(parent);
        this.renderImagePreview(parent);
        this.renderTextInput(parent, "Title", "title", "Image title");
        this.renderTextInput(parent, "Creator / Source", "creator", "Image creator or source");
        this.renderTextarea(parent, "Description", "description", "Image description", "knowledge-library-description-field");
        break;
      case "script":
        this.renderFilePicker(parent);
        this.renderSelectedFileSummary(parent);
        this.renderTextInput(parent, "Title", "title", "Script title");
        this.renderTextInput(parent, "Language", "language", "Script language");
        this.renderTextInput(parent, "Project", "project", "Project");
        this.renderTextInput(parent, "Entry point / Command", "entryPoint", "Entry point or command");
        this.renderTextInput(parent, "Creator", "creator", "Script creator");
        break;
      case "skill":
        this.renderFilePicker(parent);
        this.renderTextInput(parent, "Title", "title", "Skill title");
        this.renderTextInput(parent, "Platform / Environment", "platform", "Platform or environment");
        this.renderTextInput(parent, "Version", "version", "Skill version");
        this.renderTextInput(parent, "Entry file / Path", "entryPoint", "Entry file or path");
        this.renderTextarea(parent, "Description", "description", "Skill description", "knowledge-library-description-field");
        this.renderTextInput(parent, "Creator", "creator", "Skill creator");
        break;
      case "archive":
        this.renderFilePicker(parent);
        this.renderTextInput(parent, "Title", "title", "Archive title");
        this.renderTextInput(parent, "Archive format", "archiveFormat", "Archive format");
        this.renderTextInput(parent, "Description / Source", "description", "Archive description or source");
        this.renderTextInput(parent, "Creator", "creator", "Archive creator");
        break;
      case "other":
        this.renderBookSourceFields(parent, "Local vault file or external URL");
        this.renderTextInput(parent, "Title", "title", "Resource title");
        this.renderTextInput(parent, "Creator / Source", "creator", "Creator or source");
        this.renderTextInput(parent, "Resource subtype", "resourceSubtype", "Resource subtype");
        break;
    }
  }

  private renderCommonFields(parent: HTMLElement): void {
    this.renderTagsField(parent);
    this.renderCollectionsField(parent);
    this.renderProgressFields(parent);
    this.renderTextarea(parent, "Notes / observations", "notes", "Notes or observations", "knowledge-library-notes-field");
  }



  private renderTagsField(parent: HTMLElement): void {
    const field = parent.createEl("label", { cls: "knowledge-library-add-field knowledge-library-tags-field" });
    field.createEl("span", { text: "Tags" });
    const listId = "knowledge-library-tag-options";
    const input = field.createEl("input", { attr: { "aria-label": "Resource tags", title: "Resource tags", placeholder: this.plugin.settings.defaultTag, list: listId } });
    input.type = "text";
    input.value = String(this.state.tags ?? "");
    input.addEventListener("input", () => {
      this.setStateValue("tags", input.value);
      this.updateValidation();
    });
    const datalist = field.createEl("datalist", { attr: { id: listId } });
    for (const tag of this.plugin.addResourceService.getExistingCanonicalTags()) {
      datalist.createEl("option", { value: tag });
    }
  }

  private renderCollectionsField(parent: HTMLElement): void {
    const field = parent.createEl("label", { cls: "knowledge-library-add-field knowledge-library-collections-field" });
    field.createEl("span", { text: "Collections" });
    const listId = "knowledge-library-collection-options";
    const input = field.createEl("input", { attr: { "aria-label": "Collections", title: "Collections", placeholder: "Comma-separated collections", list: listId } });
    input.value = this.state.collections;
    input.addEventListener("input", () => {
      this.state.collections = input.value;
      this.updateValidation();
    });
    const datalist = field.createEl("datalist", { attr: { id: listId } });
    void this.plugin.resourceRepository.list().then((resources) => {
      datalist.empty();
      for (const collection of this.plugin.collectionService.collectionCounts(resources).map((item) => item.name)) {
        datalist.createEl("option", { value: collection });
      }
    });
  }
  private renderProgressFields(parent: HTMLElement): void {
    const group = parent.createDiv({ cls: "knowledge-library-progress-field" });
    this.renderSelect(group, "Priority", "priority", [
      { value: "low", label: "Low" },
      { value: "normal", label: "Normal" },
      { value: "high", label: "High" }
    ], "Resource priority").addEventListener("change", (event) => {
      this.state.priority = (event.target as HTMLSelectElement).value as AddResourceFormState["priority"];
    });

    const unit = this.progressUnitForType();
    this.state.progressUnit = unit;
    if (unit === "percent" || this.state.kind === "youtube") {
      this.renderTextInput(group, "Progress percent", "progress", "Progress percent");
    } else {
      this.renderTextInput(group, this.positionLabel(), "currentPosition", this.positionLabel());
      this.renderTextInput(group, this.totalLabel(), "totalUnits", this.totalLabel());
    }
    this.renderValidation(group, "progress");
  }

  private progressUnitForType(): KnowledgeResourceProgressUnit {
    if (this.state.kind === "pdf" || this.state.kind === "book") {
      return "pages";
    }
    if (this.state.kind === "powerpoint") {
      return "slides";
    }
    return "percent";
  }

  private positionLabel(): string {
    return this.state.kind === "powerpoint" ? "Current slide" : "Current page";
  }

  private totalLabel(): string {
    return this.state.kind === "powerpoint" ? "Total slides" : "Total pages";
  }
  private renderActions(parent: HTMLElement): void {
    const actions = parent.createDiv({ cls: "knowledge-library-add-actions" });
    const cancelButton = actions.createEl("button", { text: "Cancel", attr: { "aria-label": "Cancel Add Resource", title: "Cancel" } });
    cancelButton.addEventListener("click", () => this.close());
    this.addButton = actions.createEl("button", { text: "Add", cls: "mod-cta", attr: { "aria-label": "Add resource", title: "Add resource" } });
    this.addButton.addEventListener("click", () => void this.submit());
  }

  private renderUrlField(parent: HTMLElement, label: string, ariaLabel: string): void {
    this.renderTextInput(parent, label, "url", ariaLabel, "knowledge-library-add-url-field");
    this.renderValidation(parent, "url");
  }

  private renderBookSourceFields(parent: HTMLElement, label = "Book source"): void {
    const group = parent.createDiv({ cls: "knowledge-library-source-choice-field" });
    group.createEl("span", { text: label });
    this.renderFilePicker(group);
    this.renderTextInput(group, "External URL", "url", "External resource URL", "knowledge-library-add-url-field");
    this.renderValidation(group, "filePath");
    this.renderValidation(group, "url");
  }

  private renderManualMetadataDisclosure(parent: HTMLElement, label: string, fields: Array<[string, keyof AddResourceFormState, string]>): void {
    const details = parent.createEl("details", { cls: "knowledge-library-metadata-disclosure" });
    details.toggleAttribute("open", this.state.manualMetadata);
    details.addEventListener("toggle", () => {
      this.state.manualMetadata = details.open;
    });
    details.createEl("summary", { text: label, attr: { title: label } });
    const body = details.createDiv({ cls: "knowledge-library-disclosure-body" });
    for (const [fieldLabel, key, ariaLabel] of fields) {
      this.renderTextInput(body, fieldLabel, key, ariaLabel);
    }
  }

  private renderFilePicker(parent: HTMLElement): void {
    const field = parent.createDiv({ cls: "knowledge-library-file-picker-field" });
    field.createEl("span", { text: "Vault file" });
    const search = field.createEl("input", { attr: { placeholder: "Search filename or folder", "aria-label": "Search vault files", title: "Search vault files" } });
    search.type = "search";
    const select = field.createEl("select", { attr: { "aria-label": "Select vault file", title: "Select vault file" } });
    const selectedPath = field.createDiv({ cls: "knowledge-library-selected-file-path" });
    const clearButton = field.createEl("button", { text: "Clear file", cls: "knowledge-library-button", attr: { "aria-label": "Clear selected vault file", title: "Clear selected vault file" } });

    const populate = (): void => {
      select.empty();
      select.createEl("option", { text: "Select a file", value: "" });
      for (const file of FileResourceService.filterVaultFiles(this.app.vault.getFiles(), this.plugin.settings, search.value)) {
        select.createEl("option", { text: file.path, value: file.path });
      }
      select.value = this.state.filePath;
      selectedPath.setText(this.state.filePath ? `Selected: ${this.state.filePath}` : "No file selected");
    };

    search.addEventListener("input", populate);
    select.addEventListener("change", () => {
      this.state.filePath = select.value;
      this.afterFileSelected();
      this.render();
    });
    clearButton.addEventListener("click", () => {
      this.state.filePath = "";
      this.clearFileDerivedFields();
      this.render();
    });
    populate();
    this.renderValidation(field, "filePath");
  }

  private renderImagePreview(parent: HTMLElement): void {
    if (!this.state.filePath) {
      return;
    }

    const file = this.app.vault.getAbstractFileByPath(FileResourceService.normalizeVaultPath(this.state.filePath));
    if (!(file instanceof TFile) || !this.app.vault.getResourcePath) {
      return;
    }

    parent.createDiv({ cls: "knowledge-library-image-preview" }).createEl("img", { attr: { src: this.app.vault.getResourcePath(file), alt: "Selected image preview" } });
  }

  private renderSelectedFileSummary(parent: HTMLElement): void {
    if (!this.state.filePath) {
      return;
    }

    const extension = FileResourceService.extensionFromPath(this.state.filePath) ?? "unknown";
    parent.createDiv({ cls: "knowledge-library-selected-file-summary", text: `${FileResourceService.filenameFromPath(this.state.filePath)} | ${extension}` });
  }

  private renderTextInput(parent: HTMLElement, label: string, key: keyof AddResourceFormState, ariaLabel: string, cls = "", placeholder?: string): HTMLInputElement {
    const field = parent.createEl("label", { cls: `knowledge-library-add-field ${cls}`.trim() });
    field.createEl("span", { text: label });
    const input = field.createEl("input", { attr: { "aria-label": ariaLabel, title: ariaLabel, placeholder: placeholder ?? "" } });
    input.type = "text";
    input.value = String(this.state[key] ?? "");
    input.addEventListener("input", () => {
      this.setStateValue(key, input.value);
      this.updateValidation();
    });
    return input;
  }

  private renderTextarea(parent: HTMLElement, label: string, key: keyof AddResourceFormState, ariaLabel: string, cls = ""): HTMLTextAreaElement {
    const field = parent.createEl("label", { cls: `knowledge-library-add-field ${cls}`.trim() });
    field.createEl("span", { text: label });
    const textarea = field.createEl("textarea", { attr: { "aria-label": ariaLabel, title: ariaLabel } });
    textarea.value = String(this.state[key] ?? "");
    textarea.addEventListener("input", () => {
      this.setStateValue(key, textarea.value);
    });
    return textarea;
  }

  private renderSelect(parent: HTMLElement, label: string, key: keyof AddResourceFormState, options: Array<{ value: string; label: string }>, ariaLabel: string, cls = ""): HTMLSelectElement {
    const field = parent.createEl("label", { cls: `knowledge-library-add-field ${cls}`.trim() });
    field.createEl("span", { text: label });
    const select = field.createEl("select", { attr: { "aria-label": ariaLabel, title: ariaLabel } });
    for (const option of options) {
      select.createEl("option", { text: option.label, value: option.value });
    }
    select.value = String(this.state[key] ?? "");
    return select;
  }

  private renderValidation(parent: HTMLElement, key: ValidationKey, cls = "knowledge-library-field-validation"): void {
    this.validationEls.set(key, parent.createDiv({ cls }));
  }

  private setStateValue(key: keyof AddResourceFormState, value: string): void {
    if (key === "kind") {
      this.state.kind = value as AddResourceKind;
      return;
    }
    if (key === "manualMetadata") {
      this.state.manualMetadata = value === "true";
      return;
    }
    this.state = { ...this.state, [key]: value };
  }

  private switchType(kind: AddResourceKind): void {
    if (this.state.kind === kind) {
      return;
    }

    const previous = this.state.kind;
    this.state.kind = kind;
    this.state.manualMetadata = false;
    this.clearIncompatibleFields(previous, kind);

    if (this.state.filePath && FILE_BASED_TYPES.has(kind)) {
      const detected = FileResourceService.detectType(this.state.filePath, undefined, this.plugin.settings.defaultUnknownFileType);
      if (isAddResourceKind(detected)) {
        this.state.kind = detected;
      }
    }

    this.render();
  }

  private clearIncompatibleFields(previous: AddResourceKind, next: AddResourceKind): void {
    const previousSupportsFile = FILE_BASED_TYPES.has(previous) || previous === "book" || previous === "other";
    const nextSupportsFile = FILE_BASED_TYPES.has(next) || next === "book" || next === "other";
    const nextSupportsUrl = next === "youtube" || next === "website" || next === "book" || next === "other";

    if (!nextSupportsFile) {
      this.state.filePath = "";
      this.clearFileDerivedFields();
    }
    if (!nextSupportsUrl) {
      this.state.url = "";
    }
    if (previousSupportsFile && !nextSupportsFile) {
      this.state.language = "";
      this.state.archiveFormat = "";
    }
  }

  private applyInitialFilePath(path: string): void {
    const normalizedPath = FileResourceService.normalizeVaultPath(path);
    const file = this.app.vault.getAbstractFileByPath(normalizedPath);
    if (!(file instanceof TFile) || !FileResourceService.isAllowedFile(file, this.plugin.settings)) {
      this.state.filePath = "";
      return;
    }

    this.state.filePath = normalizedPath;
    const detected = FileResourceService.detectType(normalizedPath, undefined, this.plugin.settings.defaultUnknownFileType);
    if (isAddResourceKind(detected)) {
      this.state.kind = detected;
    }
    this.afterFileSelected();
  }

  private afterFileSelected(): void {
    if (!this.state.filePath) {
      return;
    }

    const detected = FileResourceService.detectType(this.state.filePath, undefined, this.plugin.settings.defaultUnknownFileType);
    if (isAddResourceKind(detected) && FILE_BASED_TYPES.has(this.state.kind)) {
      this.state.kind = detected;
    }
    if (!this.state.title) {
      this.state.title = FileResourceService.filenameFromPath(this.state.filePath).replace(/\.[^.]+$/, "");
    }
    const typeInfo = FileResourceService.typeInfo(this.state.filePath);
    if (!this.state.language && typeInfo.scriptLanguage) {
      this.state.language = typeInfo.scriptLanguage;
    }
    if (!this.state.archiveFormat && typeInfo.archiveFormat) {
      this.state.archiveFormat = typeInfo.archiveFormat;
    }
  }

  private clearFileDerivedFields(): void {
    this.state.language = "";
    this.state.archiveFormat = "";
  }

  private updateValidation(): void {
    const errors = this.validate();
    for (const [key, element] of this.validationEls.entries()) {
      element.setText(errors.get(key) ?? "");
    }
    this.addButton.disabled = errors.size > 0;
  }

  private validate(): Map<ValidationKey, string> {
    const errors = new Map<ValidationKey, string>();
    const url = this.state.url.trim();
    const filePath = this.state.filePath.trim();

    if (this.state.kind === "youtube" && !url) {
      errors.set("url", "YouTube URL is required.");
    }
    if (this.state.kind === "website" && !url) {
      errors.set("url", "Website URL is required.");
    }
    if (FILE_BASED_TYPES.has(this.state.kind) && !filePath) {
      errors.set("filePath", "Select a vault file.");
    }
    const progressError = this.validateProgress();
    if (progressError) {
      errors.set("progress", progressError);
    }

    if ((this.state.kind === "book" || this.state.kind === "other") && !filePath && !url) {
      errors.set("filePath", "Select a vault file or enter a URL.");
      errors.set("url", "Enter a URL or select a vault file.");
    }

    return errors;
  }


  private validateProgress(): string | null {
    const progress = this.optionalNumber(this.state.progress);
    const current = this.optionalNumber(this.state.currentPosition);
    const total = this.optionalNumber(this.state.totalUnits);
    if (progress !== null && (!Number.isFinite(progress) || progress < 0 || progress > 100)) {
      return "Progress must be from 0 to 100.";
    }
    if (current !== null && (!Number.isFinite(current) || current < 0)) {
      return "Current position cannot be negative.";
    }
    if (total !== null && (!Number.isFinite(total) || total <= 0)) {
      return "Total units must be greater than zero.";
    }
    return null;
  }

  private optionalNumber(value: string): number | null {
    if (!value.trim()) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }
  private buildRequest(): AddResourceRequest {
    return {
      kind: this.state.kind,
      url: this.state.url,
      filePath: this.state.filePath,
      title: this.state.manualMetadata || this.shouldSubmitTitle() ? this.state.title : undefined,
      creator: this.state.manualMetadata || this.shouldSubmitCreator() ? this.state.creator : undefined,
      tags: [this.state.tags],
      collections: [this.state.collections],
      priority: this.state.priority,
      progress: this.optionalNumber(this.state.progress) ?? undefined,
      progress_unit: this.state.progressUnit,
      current_position: this.optionalNumber(this.state.currentPosition),
      total_units: this.optionalNumber(this.state.totalUnits),
      completed: this.optionalNumber(this.state.progress) === 100,
      notes: this.state.notes,
      edition: this.state.edition,
      publisher: this.state.publisher,
      isbn: this.state.isbn,
      category: this.state.category,
      presentationDate: this.state.presentationDate,
      documentDate: this.state.documentDate,
      sourceProject: this.state.sourceProject,
      description: this.state.description,
      language: this.state.language,
      project: this.state.project,
      entryPoint: this.state.entryPoint,
      platform: this.state.platform,
      version: this.state.version,
      archiveFormat: this.state.archiveFormat,
      resourceSubtype: this.state.resourceSubtype
    };
  }

  private shouldSubmitTitle(): boolean {
    return this.state.kind !== "youtube" && this.state.kind !== "website";
  }

  private shouldSubmitCreator(): boolean {
    return this.state.kind !== "youtube" && this.state.kind !== "website";
  }

  private async submit(): Promise<void> {
    const errors = this.validate();
    this.updateValidation();
    if (errors.size > 0) {
      return;
    }

    this.addButton.disabled = true;
    this.validationEls.get("global")?.setText("Fetching metadata...");

    try {
      const result = await this.plugin.addResourceFromWizard(this.buildRequest());
      new Notice(result.duplicate ? "Resource already exists. Opened existing note." : "Resource added.");
      this.close();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to add resource.";
      if (message.toLowerCase().includes("url")) {
        this.validationEls.get("url")?.setText(message);
      } else if (message.toLowerCase().includes("file")) {
        this.validationEls.get("filePath")?.setText(message);
      } else {
        this.validationEls.get("global")?.setText(message);
      }
    } finally {
      this.addButton.disabled = false;
      this.updateValidation();
    }
  }
}
