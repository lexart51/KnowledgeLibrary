import { Notice } from "obsidian";
import KnowledgeLibraryPlugin from "../main";

export function registerLibraryCommands(plugin: KnowledgeLibraryPlugin): void {
  plugin.addCommand({
    id: "open-library",
    name: "Knowledge Library: Open Library",
    callback: () => {
      void plugin.openLibraryView().catch((error) => {
        new Notice(error instanceof Error ? error.message : "Unable to open Knowledge Library.");
      });
    }
  });
}
