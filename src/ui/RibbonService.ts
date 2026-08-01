import { Notice, Plugin } from "obsidian";

export class RibbonService {
  constructor(private readonly plugin: Plugin) {}

  register(): void {
    this.plugin.addRibbonIcon("library", "Open Knowledge Library", () => {
      new Notice("Knowledge Library is ready.");
    }).addClass("knowledge-library-ribbon");
  }
}
