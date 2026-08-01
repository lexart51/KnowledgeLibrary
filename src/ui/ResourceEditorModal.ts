import { App, Modal, Notice, TFile } from "obsidian";
import { KnowledgeResource, KnowledgeResourcePriority, KnowledgeResourceProgressUnit, KnowledgeResourceRelationshipType, KnowledgeResourceStatus } from "../models/KnowledgeResource";
import { CollectionService } from "../services/CollectionService";
import { ProgressService } from "../services/ProgressService";
import { RelationshipService, RELATIONSHIP_TYPES } from "../services/RelationshipService";
import { StoredResource, VaultResourceRepository } from "../services/VaultResourceRepository";

interface EditorState {
  title: string;
  creator: string;
  tags: string;
  collections: string;
  status: KnowledgeResourceStatus;
  priority: KnowledgeResourcePriority;
  progress: string;
  progressUnit: KnowledgeResourceProgressUnit;
  currentPosition: string;
  totalUnits: string;
  favorite: boolean;
  completed: boolean;
  notes: string;
  relatedResourceId: string;
  relationshipType: KnowledgeResourceRelationshipType;
  relationshipNote: string;
}

export class ResourceEditorModal extends Modal {
  private allResources: StoredResource[] = [];
  private state: EditorState;

  constructor(
    app: App,
    private readonly stored: StoredResource,
    private readonly repository: VaultResourceRepository,
    private readonly collectionService: CollectionService,
    private readonly relationshipService: RelationshipService,
    private readonly onChanged: () => Promise<void>
  ) {
    super(app);
    this.state = this.fromResource(stored.resource);
  }

  async onOpen(): Promise<void> {
    this.contentEl.addClass("knowledge-library-editor-modal");
    this.allResources = await this.repository.list();
    this.render();
  }

  private render(): void {
    this.contentEl.empty();
    this.contentEl.createEl("h2", { text: "Edit resource" });
    const form = this.contentEl.createDiv({ cls: "knowledge-library-editor-form" });
    this.input(form, "Title", "title");
    this.input(form, "Creator", "creator");
    this.input(form, "Tags", "tags");
    this.input(form, "Collections", "collections");
    this.select(form, "Status", "status", ["active", "archived", "unavailable"]);
    this.select(form, "Priority", "priority", ["low", "normal", "high"]);
    this.input(form, "Progress", "progress");
    this.select(form, "Progress unit", "progressUnit", ["percent", "pages", "slides", "chapters", "minutes", "custom"]);
    this.input(form, "Current position", "currentPosition");
    this.input(form, "Total units", "totalUnits");
    this.checkbox(form, "Favorite", "favorite");
    this.checkbox(form, "Completed", "completed");
    this.textarea(form, "Notes", "notes");
    this.renderRelationships(form);

    const actions = form.createDiv({ cls: "knowledge-library-add-actions" });
    this.button(actions, "Cancel", "Cancel editing resource", () => this.close());
    this.button(actions, "Save", "Save resource", () => void this.save(), "mod-cta");
  }

  private renderRelationships(parent: HTMLElement): void {
    const section = parent.createDiv({ cls: "knowledge-library-relationships-section" });
    section.createEl("h3", { text: "Related resources" });
    const existing = section.createDiv({ cls: "knowledge-library-relationship-list" });
    for (const relationship of this.stored.resource.related_resources ?? []) {
      const target = this.relationshipService.resolve(this.allResources, relationship.resource_id);
      const row = existing.createDiv({ cls: "knowledge-library-relationship-row" });
      row.createSpan({ text: `${relationship.relationship_type}: ${target?.resource.title ?? relationship.resource_id}` });
      this.button(row, "Open", `Open ${relationship.resource_id}`, () => void this.openRelated(relationship.resource_id));
      this.button(row, "Remove", `Remove relationship ${relationship.resource_id}`, () => {
        this.stored.resource.related_resources = this.relationshipService.removeRelationship(this.stored.resource, relationship).related_resources;
        this.render();
      });
    }

    const picker = section.createEl("select", { attr: { "aria-label": "Select related resource", title: "Select related resource" } });
    picker.createEl("option", { text: "Select related resource", value: "" });
    for (const item of this.allResources.filter((item) => item.resource.id !== this.stored.resource.id)) {
      picker.createEl("option", { text: item.resource.title, value: item.resource.id });
    }
    picker.addEventListener("change", () => this.state.relatedResourceId = picker.value);
    this.select(section, "Relationship type", "relationshipType", RELATIONSHIP_TYPES);
    this.input(section, "Relationship note", "relationshipNote");
    this.button(section, "Add relationship", "Add relationship", () => {
      try {
        this.stored.resource.related_resources = this.relationshipService.addRelationship(this.stored.resource, {
          resource_id: this.state.relatedResourceId,
          relationship_type: this.state.relationshipType,
          note: this.state.relationshipNote
        }).related_resources;
        this.state.relatedResourceId = "";
        this.state.relationshipNote = "";
        this.render();
      } catch (error) {
        new Notice(error instanceof Error ? error.message : "Unable to add relationship.");
      }
    });
  }

  private async openRelated(resourceId: string): Promise<void> {
    const target = this.relationshipService.resolve(this.allResources, resourceId);
    if (!target) {
      new Notice("Related resource note is missing.");
      return;
    }
    const file = this.app.vault.getAbstractFileByPath(target.path);
    if (file instanceof TFile) {
      await this.app.workspace.getLeaf(false).openFile(file);
    }
  }

  private async save(): Promise<void> {
    try {
      const progress = new ProgressService().normalize({
        completed: this.state.completed,
        progress: this.numberOrUndefined(this.state.progress),
        progress_unit: this.state.progressUnit,
        current_position: this.numberOrNull(this.state.currentPosition),
        total_units: this.numberOrNull(this.state.totalUnits)
      });
      const updated: KnowledgeResource = {
        ...this.stored.resource,
        title: this.state.title.trim() || this.stored.resource.title,
        creator: this.state.creator.trim() || null,
        tags: this.state.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        collections: this.collectionService.normalizeCollections(this.state.collections.split(",")),
        status: this.state.status,
        priority: this.state.priority,
        favorite: this.state.favorite,
        completed: progress.completed,
        progress: progress.progress,
        progress_unit: progress.progress_unit,
        current_position: progress.current_position,
        total_units: progress.total_units,
        metadata: { ...this.stored.resource.metadata, notes: this.state.notes.trim() }
      };

      await this.repository.update(this.stored.path, updated);
      await this.onChanged();
      this.close();
    } catch (error) {
      new Notice(error instanceof Error ? error.message : "Unable to save resource.");
    }
  }

  private fromResource(resource: KnowledgeResource): EditorState {
    return {
      title: resource.title,
      creator: resource.creator ?? "",
      tags: resource.tags.join(", "),
      collections: (resource.collections ?? []).join(", "),
      status: resource.status,
      priority: resource.priority ?? "normal",
      progress: String(resource.progress ?? 0),
      progressUnit: resource.progress_unit ?? "percent",
      currentPosition: resource.current_position === null || resource.current_position === undefined ? "" : String(resource.current_position),
      totalUnits: resource.total_units === null || resource.total_units === undefined ? "" : String(resource.total_units),
      favorite: resource.favorite,
      completed: resource.completed,
      notes: typeof resource.metadata.notes === "string" ? resource.metadata.notes : "",
      relatedResourceId: "",
      relationshipType: "related",
      relationshipNote: ""
    };
  }

  private input(parent: HTMLElement, labelText: string, key: keyof EditorState): void {
    const label = parent.createEl("label", { cls: "knowledge-library-add-field" });
    label.createSpan({ text: labelText });
    const input = label.createEl("input", { attr: { "aria-label": labelText, title: labelText } });
    input.value = String(this.state[key] ?? "");
    input.addEventListener("input", () => this.state[key] = input.value as never);
  }

  private textarea(parent: HTMLElement, labelText: string, key: keyof EditorState): void {
    const label = parent.createEl("label", { cls: "knowledge-library-add-field knowledge-library-notes-field" });
    label.createSpan({ text: labelText });
    const textarea = label.createEl("textarea", { attr: { "aria-label": labelText, title: labelText } });
    textarea.value = String(this.state[key] ?? "");
    textarea.addEventListener("input", () => this.state[key] = textarea.value as never);
  }

  private select(parent: HTMLElement, labelText: string, key: keyof EditorState, options: string[]): void {
    const label = parent.createEl("label", { cls: "knowledge-library-add-field" });
    label.createSpan({ text: labelText });
    const select = label.createEl("select", { attr: { "aria-label": labelText, title: labelText } });
    for (const option of options) {
      select.createEl("option", { text: option, value: option });
    }
    select.value = String(this.state[key] ?? "");
    select.addEventListener("change", () => this.state[key] = select.value as never);
  }

  private checkbox(parent: HTMLElement, labelText: string, key: keyof EditorState): void {
    const label = parent.createEl("label", { cls: "knowledge-library-checkbox" });
    const input = label.createEl("input", { attr: { "aria-label": labelText, title: labelText } });
    input.type = "checkbox";
    input.checked = Boolean(this.state[key]);
    label.createSpan({ text: labelText });
    input.addEventListener("change", () => this.state[key] = input.checked as never);
  }

  private button(parent: HTMLElement, text: string, ariaLabel: string, onClick: () => void, cls = ""): void {
    const button = parent.createEl("button", { text, cls: `knowledge-library-button ${cls}`.trim(), attr: { "aria-label": ariaLabel, title: ariaLabel } });
    button.addEventListener("click", onClick);
  }

  private numberOrUndefined(value: string): number | undefined {
    return value.trim() ? Number(value) : undefined;
  }

  private numberOrNull(value: string): number | null {
    return value.trim() ? Number(value) : null;
  }
}
