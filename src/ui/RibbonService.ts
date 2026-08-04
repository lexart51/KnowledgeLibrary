import { Notice, Plugin } from "obsidian";

export class RibbonService {
  constructor(
    private readonly plugin: Plugin,
    private readonly openLibrary: () => Promise<void>,
    private readonly openUniversalSearch: () => Promise<void>
  ) {}

  register(): void {
    this.plugin.addRibbonIcon("library", "Open Knowledge Library", () => {
      void this.openLibrary().catch((error) => {
        new Notice(error instanceof Error ? error.message : "Unable to open Knowledge Library.");
      });
    }).addClass("knowledge-library-ribbon");

    this.plugin.addRibbonIcon("search", "Open universal search", () => {
      void this.openUniversalSearch().catch((error) => {
        new Notice(error instanceof Error ? error.message : "Unable to open universal search.");
      });
    }).addClass("knowledge-library-ribbon");
  }
}
