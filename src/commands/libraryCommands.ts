import { Notice } from "obsidian";
import KnowledgeLibraryPlugin from "../main";
import { ConfirmationModal, MaintenanceReportModal, TagAnalysisModal, ThumbnailAnalysisModal } from "../ui/MaintenanceModals";
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

  plugin.addCommand({ id: "add-resource", name: "Knowledge Library: Add Resource", callback: () => plugin.openAddResourceModal() });
  plugin.addCommand({ id: "manage-collections", name: "Knowledge Library: Manage collections", callback: () => plugin.openCollectionsManager() });

  plugin.addCommand({
    id: "edit-selected-resource",
    name: "Knowledge Library: Edit selected resource",
    callback: () => {
      void plugin.openSelectedResourceEditor().catch((error) => {
        new Notice(error instanceof Error ? error.message : "Unable to edit selected resource.");
      });
    }
  });

  plugin.addCommand({
    id: "open-dashboard",
    name: "Knowledge Library: Open Dashboard",
    callback: () => {
      void plugin.openDashboardView().catch((error) => {
        new Notice(error instanceof Error ? error.message : "Unable to open Knowledge Dashboard.");
      });
    }
  });

  plugin.addCommand({
    id: "analyze-existing-vault",
    name: "Knowledge Library: Analyze existing vault",
    callback: () => {
      void plugin.migrationService.analyzeVault().then((report) => new MigrationReportModal(plugin.app, report, "audit").open()).catch((error) => {
        new Notice(error instanceof Error ? error.message : "Unable to analyze existing vault.");
      });
    }
  });

  plugin.addCommand({
    id: "simulate-migration",
    name: "Knowledge Library: Simulate migration",
    callback: () => {
      void plugin.migrationService.analyzeVault().then((report) => new MigrationReportModal(plugin.app, report, "simulation").open()).catch((error) => {
        new Notice(error instanceof Error ? error.message : "Unable to simulate migration.");
      });
    }
  });

  plugin.addCommand({
    id: "create-migration-backup",
    name: "Knowledge Library: Create migration backup",
    callback: () => {
      void plugin.safeMigrationService.createBackup(true).then((preview) => {
        new ConfirmationModal(plugin.app, "Create migration backup", "Back up every note that would be changed by migration. No active library notes are modified.", [
          ["Notes to back up", preview.changed.length],
          ["Manual review skipped", preview.manualReview.length],
          ["Expected failures", preview.failed.length]
        ], async () => {
          const report = await plugin.safeMigrationService.createBackup(false);
          new MaintenanceReportModal(plugin.app, "Migration Backup Report", report).open();
        }).open();
      }).catch((error) => new Notice(error instanceof Error ? error.message : "Unable to prepare migration backup."));
    }
  });

  plugin.addCommand({
    id: "apply-migration",
    name: "Knowledge Library: Apply migration",
    callback: () => {
      void plugin.safeMigrationService.applyMigration(true).then((preview) => {
        new ConfirmationModal(plugin.app, "Apply migration", "This updates YAML frontmatter only and preserves Markdown body content. Notes requiring manual review are skipped.", [
          ["Notes to change", preview.changed.length],
          ["Manual review skipped", preview.manualReview.length],
          ["Expected failures", preview.failed.length]
        ], async () => {
          const report = await plugin.safeMigrationService.applyMigration(false);
          new MaintenanceReportModal(plugin.app, "Migration Apply Report", report).open();
          await plugin.refreshLibraryViews();
        }).open();
      }).catch((error) => new Notice(error instanceof Error ? error.message : "Unable to prepare migration."));
    }
  });

  plugin.addCommand({
    id: "analyze-tags",
    name: "Knowledge Library: Analyze tags",
    callback: () => {
      void plugin.tagConsolidationService.analyze().then((items) => new TagAnalysisModal(plugin.app, items).open()).catch((error) => {
        new Notice(error instanceof Error ? error.message : "Unable to analyze tags.");
      });
    }
  });

  plugin.addCommand({
    id: "consolidate-tag-aliases",
    name: "Knowledge Library: Consolidate tag aliases",
    callback: () => {
      void plugin.tagConsolidationService.analyze().then((items) => {
        new TagAnalysisModal(plugin.app, items).open();
        new ConfirmationModal(plugin.app, "Consolidate tag aliases", "Preview exact replacements before writing. Only YAML frontmatter tags are changed.", [
          ["Notes to change", items.length]
        ], async () => {
          const report = await plugin.tagConsolidationService.consolidate(false);
          new MaintenanceReportModal(plugin.app, "Tag Consolidation Report", report).open();
          await plugin.refreshLibraryViews();
        }).open();
      }).catch((error) => new Notice(error instanceof Error ? error.message : "Unable to consolidate tags."));
    }
  });

  plugin.addCommand({
    id: "repair-youtube-thumbnails",
    name: "Knowledge Library: Repair YouTube thumbnails",
    callback: () => {
      void plugin.thumbnailRepairService.analyze().then((items) => {
        new ThumbnailAnalysisModal(plugin.app, items).open();
        new ConfirmationModal(plugin.app, "Repair YouTube thumbnails", "Restore deterministic YouTube thumbnail URLs from video ids. Remote metadata is not fetched.", [
          ["Thumbnails to repair", items.length]
        ], async () => {
          const report = await plugin.thumbnailRepairService.repair(false);
          new MaintenanceReportModal(plugin.app, "Thumbnail Repair Report", report).open();
          await plugin.refreshLibraryViews();
        }).open();
      }).catch((error) => new Notice(error instanceof Error ? error.message : "Unable to repair thumbnails."));
    }
  });
}
