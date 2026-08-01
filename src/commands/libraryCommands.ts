import { Notice } from "obsidian";
import KnowledgeLibraryPlugin from "../main";
import { MigrationReportModal } from "../ui/MigrationReportModal";

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

  plugin.addCommand({
    id: "add-resource",
    name: "Knowledge Library: Add Resource",
    callback: () => {
      plugin.openAddResourceModal();
    }
  });

  plugin.addCommand({
    id: "analyze-existing-vault",
    name: "Knowledge Library: Analyze existing vault",
    callback: () => {
      void plugin.migrationService.analyzeVault().then((report) => {
        new MigrationReportModal(plugin.app, report, "audit").open();
      }).catch((error) => {
        new Notice(error instanceof Error ? error.message : "Unable to analyze existing vault.");
      });
    }
  });

  plugin.addCommand({
    id: "simulate-migration",
    name: "Knowledge Library: Simulate migration",
    callback: () => {
      void plugin.migrationService.analyzeVault().then((report) => {
        new MigrationReportModal(plugin.app, report, "simulation").open();
      }).catch((error) => {
        new Notice(error instanceof Error ? error.message : "Unable to simulate migration.");
      });
    }
  });
}
