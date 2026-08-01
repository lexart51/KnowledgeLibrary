import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("UI/UX regression contracts", () => {
  it("keeps the Add Resource modal on responsive structure classes", () => {
    const modal = source("src/ui/AddResourceModal.ts");

    expect(modal).toContain("knowledge-library-add-modal-shell");
    expect(modal).toContain("knowledge-library-add-modal");
    expect(modal).toContain("knowledge-library-add-form");
    expect(modal).toContain("knowledge-library-type-field");
    expect(modal).toContain("knowledge-library-file-picker-field");
    expect(modal).toContain("knowledge-library-field-validation");
    expect(modal).toContain("knowledge-library-tags-field");
  });

  it("preserves conditional Add Resource fields by resource type", () => {
    const modal = source("src/ui/AddResourceModal.ts");

    expect(modal).toContain('switch (this.state.kind)');
    expect(modal).toContain('case "youtube"');
    expect(modal).toContain('case "website"');
    expect(modal).toContain('case "book"');
    expect(modal).toContain('this.renderBookSourceFields(parent)');
    expect(modal).toContain('FILE_BASED_TYPES.has(this.state.kind) && !filePath');
  });

  it("uses toolbar wrapping classes and keeps the 200-item scroll regression", () => {
    const view = source("src/ui/KnowledgeLibraryView.ts");
    const test = source("tests/library-view.test.ts");

    expect(view).toContain("knowledge-library-toolbar");
    expect(view).toContain("knowledge-library-toolbar-group is-search");
    expect(view).toContain("knowledge-library-toolbar-group is-filters");
    expect(view).toContain("knowledge-library-toolbar-group is-toggles");
    expect(test).toContain("length: 200");
  });

  it("declares resource type card classes for all supported types", () => {
    const view = source("src/ui/KnowledgeLibraryView.ts");

    for (const type of ["youtube", "website", "pdf", "powerpoint", "document", "book", "markdown", "image", "script", "skill", "archive"]) {
      expect(view).toContain(`case "${type}"`);
    }
    expect(view).toContain('data-resource-type');
    expect(view).toContain('is-${resource.type}');
  });

  it("adds accessibility labels and titles to buttons and controls", () => {
    const modal = source("src/ui/AddResourceModal.ts");
    const view = source("src/ui/KnowledgeLibraryView.ts");

    expect(modal).toContain('"aria-label": "Add resource"');
    expect(modal).toContain('"aria-label": "Cancel Add Resource"');
    expect(modal).toContain('"aria-label": "Select vault file"');
    expect(view).toContain('"aria-label": "Refresh library"');
    expect(view).toContain('"aria-label": ariaLabel');
    expect(view).toContain('title: ariaLabel');
  });

  it("preserves card density classes", () => {
    const view = source("src/ui/KnowledgeLibraryView.ts");
    const css = source("src/styles.css");

    expect(view).toContain('is-${this.plugin.settings.displayCardDensity}');
    expect(css).toContain(".knowledge-library-grid.is-compact");
  });

  it("uses Obsidian theme variables and avoids hard-coded color values", () => {
    const css = source("src/styles.css");

    expect(css).toContain("var(--background-primary)");
    expect(css).toContain("var(--background-secondary)");
    expect(css).toContain("var(--text-muted)");
    expect(css).toContain("var(--interactive-accent)");
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(css).not.toMatch(/rgba?\(/);
  });

  it("uses viewport-safe modal sizing and removes horizontal overflow", () => {
    const css = source("src/styles.css");

    expect(css).toMatch(/\.knowledge-library-add-modal\s*{[^}]*height:\s*auto;[^}]*max-height:\s*calc\(100vh - 48px\);[^}]*max-width:\s*calc\(100vw - 48px\);[^}]*overflow-x:\s*hidden;[^}]*overflow-y:\s*auto;[^}]*width:\s*min\(960px, calc\(100vw - 48px\)\);/s);
    expect(css).toMatch(/overflow-x:\s*hidden;/);
    expect(css).toMatch(/\.knowledge-library-scroll\s*{[^}]*height:\s*100%;[^}]*min-height:\s*0;[^}]*overflow-y:\s*auto;/s);
  });

  it("keeps the Add Resource grid shrink-safe", () => {
    const css = source("src/styles.css");

    expect(css).toContain("grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)");
    expect(css).toMatch(/\.knowledge-library-add-form > \*,[\s\S]*?min-width:\s*0;/);
    expect(css).toMatch(/\.knowledge-library-add-field input,[\s\S]*?max-width:\s*100%;[\s\S]*?width:\s*100%;/);
  });

  it("keeps full-width rows and sticky actions inside the modal grid", () => {
    const css = source("src/styles.css");

    expect(css).toMatch(/\.knowledge-library-tags-field,[\s\S]*?\.knowledge-library-add-actions\s*{[^}]*grid-column:\s*1 \/ -1;/);
    expect(css).toMatch(/\.knowledge-library-add-actions\s*{[^}]*flex-wrap:\s*wrap;[^}]*position:\s*sticky;/s);
  });

  it("uses the rc.2 one-column breakpoint and constrained type selector", () => {
    const css = source("src/styles.css");

    expect(css).toContain("@media (max-width: 760px)");
    expect(css).toMatch(/@media \(max-width: 760px\)[\s\S]*?\.knowledge-library-add-form,[\s\S]*?grid-template-columns:\s*1fr;/s);
    expect(css).toMatch(/\.knowledge-library-type-field select\s*{[^}]*max-height:\s*min\(320px, 50vh\);[^}]*width:\s*100%;/s);
  });

  it("selects specialized Add Resource forms by type", () => {
    const modal = source("src/ui/AddResourceModal.ts");

    for (const type of ["youtube", "website", "pdf", "book", "powerpoint", "document", "markdown", "image", "script", "skill", "archive", "other"]) {
      expect(modal).toContain(`case "${type}"`);
    }
    expect(modal).toContain("renderSpecializedFields");
    expect(modal).toContain("AddResourceFormState");
  });

  it("keeps YouTube and Website minimal with manual metadata disclosure", () => {
    const modal = source("src/ui/AddResourceModal.ts");

    expect(modal).toContain('this.renderUrlField(parent, "YouTube URL"');
    expect(modal).toContain('this.renderUrlField(parent, "Website URL"');
    expect(modal).toContain('this.renderManualMetadataDisclosure(parent, "Edit metadata manually"');
    expect(modal).toContain('this.state.manualMetadata');
  });

  it("keeps file-based forms on the primary vault file picker", () => {
    const modal = source("src/ui/AddResourceModal.ts");

    expect(modal).toContain('const FILE_BASED_TYPES');
    expect(modal).toContain('this.renderFilePicker(parent)');
    expect(modal).toContain('Clear file');
    expect(modal).toContain('Selected: ${this.state.filePath}');
    expect(modal).toContain('const detected = FileResourceService.detectType(normalizedPath');
    expect(modal).toContain('this.state.kind = detected');
  });

  it("implements type-specific validation for required source fields", () => {
    const modal = source("src/ui/AddResourceModal.ts");

    expect(modal).toContain('YouTube URL is required.');
    expect(modal).toContain('Website URL is required.');
    expect(modal).toContain('Select a vault file.');
    expect(modal).toContain('Select a vault file or enter a URL.');
    expect(modal).toContain('this.addButton.disabled = errors.size > 0');
  });

  it("preserves tags and notes while clearing incompatible fields on type switch", () => {
    const modal = source("src/ui/AddResourceModal.ts");

    expect(modal).toContain('private switchType');
    expect(modal).toContain('private clearIncompatibleFields');
    expect(modal).toContain('this.state.filePath = ""');
    expect(modal).toContain('this.state.url = ""');
    expect(modal).toContain('tags: [this.state.tags]');
    expect(modal).toContain('notes: this.state.notes');
  });

  it("submits all specialized forms through the shared AddResourceService integration", () => {
    const modal = source("src/ui/AddResourceModal.ts");

    expect(modal).toContain('private buildRequest(): AddResourceRequest');
    expect(modal).toContain('this.plugin.addResourceFromWizard(this.buildRequest())');
    expect(modal).not.toContain('new AddResourceService');
  });

  it("groups settings into expected sections", () => {
    const settings = source("src/ui/KnowledgeLibrarySettingTab.ts");

    for (const group of ["Storage", "Display", "File resources", "Tags", "Migration and safety"]) {
      expect(settings).toContain(`"${group}"`);
    }
    expect(settings).toContain("knowledge-library-settings-group");
  });
});
