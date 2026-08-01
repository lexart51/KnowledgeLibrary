import { Notice } from "obsidian";
import KnowledgeLibraryPlugin from "../main";

export function registerLibraryCommands(plugin: KnowledgeLibraryPlugin): void {
  plugin.addCommand({
    id: "open-library",
    name: "Knowledge Library: Open Library",
    callback: () => {
      new Notice("Knowledge Library opened.");
    }
  });
}
