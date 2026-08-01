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

    expect(modal).toContain('kind === "youtube" || kind === "website"');
    expect(modal).toContain('kind === "book" && !this.fileSelect.value');
    expect(modal).toContain('this.bookFields.toggleClass("is-hidden", kind !== "book")');
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

    expect(css).toMatch(/\.knowledge-library-add-modal\s*{[^}]*max-width:\s*calc\(100vw - 48px\);[^}]*overflow-y:\s*auto;[^}]*width:\s*min\(960px, calc\(100vw - 48px\)\);/s);
    expect(css).not.toMatch(/overflow-x\s*:/);
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
    expect(css).toMatch(/\.knowledge-library-add-form\s*{[^}]*grid-template-columns:\s*1fr;/s);
    expect(css).toMatch(/\.knowledge-library-type-field select\s*{[^}]*max-height:\s*min\(320px, 50vh\);[^}]*width:\s*100%;/s);
  });

  it("groups settings into expected sections", () => {
    const settings = source("src/ui/KnowledgeLibrarySettingTab.ts");

    for (const group of ["Storage", "Display", "File resources", "Tags", "Migration and safety"]) {
      expect(settings).toContain(`"${group}"`);
    }
    expect(settings).toContain("knowledge-library-settings-group");
  });
});
