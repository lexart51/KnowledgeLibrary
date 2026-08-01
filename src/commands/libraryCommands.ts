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
    id: "open-diagnostics",
    name: "Knowledge Library: Open diagnostics",
    callback: () => {
      void plugin.openDiagnosticsView().catch((error) => new Notice(error instanceof Error ? error.message : "Unable to open diagnostics."));
    }
  });

  plugin.addCommand({
    id: "export-plugin-configuration",
    name: "Knowledge Library: Export plugin configuration",
    callback: () => {
      void plugin.exportPluginConfiguration().then((json) => navigator.clipboard.writeText(json).then(() => new Notice("Plugin configuration copied."))).catch((error) => new Notice(error instanceof Error ? error.message : "Unable to export plugin configuration."));
    }
  });

  plugin.addCommand({
    id: "import-plugin-configuration",
    name: "Knowledge Library: Import plugin configuration",
    callback: () => {
      const payload = window.prompt("Paste KnowledgeLibrary configuration JSON");
      if (!payload) return;
      void plugin.importPluginConfiguration(payload).then(() => new Notice("Plugin configuration imported.")).catch((error) => new Notice(error instanceof Error ? error.message : "Unable to import plugin configuration."));
    }
  });

  plugin.addCommand({
    id: "backup-plugin-state",
    name: "Knowledge Library: Backup plugin state",
    callback: () => {
      void plugin.backupPluginState().then((id) => new Notice(`Plugin state backup created: ${id}`)).catch((error) => new Notice(error instanceof Error ? error.message : "Unable to back up plugin state."));
    }
  });

  plugin.addCommand({
    id: "restore-plugin-state",
    name: "Knowledge Library: Restore plugin state",
    callback: () => {
      const backupId = window.prompt("Backup id to restore");
      if (!backupId) return;
      void plugin.restorePluginState(backupId).then(() => new Notice("Plugin state restored.")).catch((error) => new Notice(error instanceof Error ? error.message : "Unable to restore plugin state."));
    }
  });

  plugin.addCommand({
    id: "run-self-diagnostics",
    name: "Knowledge Library: Run self diagnostics",
    callback: () => {
      void plugin.runSelfDiagnostics().then((report) => navigator.clipboard.writeText(report).then(() => new Notice("Self diagnostics copied."))).catch((error) => new Notice(error instanceof Error ? error.message : "Unable to run self diagnostics."));
    }
  });
  plugin.addCommand({
    id: "manage-vault-connectors",
    name: "Knowledge Library: Manage vault connectors",
    callback: () => plugin.openVaultConnectorsManager()
  });

  plugin.addCommand({
    id: "test-vault-connectors",
    name: "Knowledge Library: Test vault connectors",
    callback: () => {
      void plugin.unifiedIndexService.rebuild().then((index) => {
        const enabled = index.connector_statuses.filter((status) => status.connector.enabled).length;
        const available = index.connector_statuses.filter((status) => status.connector.enabled && status.available).length;
        new Notice(`${available}/${enabled} enabled vault connectors available.`);
      }).catch((error) => new Notice(error instanceof Error ? error.message : "Unable to test vault connectors."));
    }
  });

  plugin.addCommand({
    id: "refresh-unified-index",
    name: "Knowledge Library: Refresh unified index",
    callback: () => {
      void plugin.refreshUnifiedIndex().then(() => plugin.refreshLibraryViews()).catch((error) => new Notice(error instanceof Error ? error.message : "Unable to refresh unified index."));
    }
  });

  plugin.addCommand({
    id: "rebuild-unified-index",
    name: "Knowledge Library: Rebuild unified index",
    callback: () => {
      void plugin.rebuildUnifiedIndex().then(() => plugin.refreshLibraryViews()).catch((error) => new Notice(error instanceof Error ? error.message : "Unable to rebuild unified index."));
    }
  });

  plugin.addCommand({
    id: "search-connected-vaults",
    name: "Knowledge Library: Search all connected vaults",
    callback: () => plugin.openUnifiedSearch()
  });
  plugin.addCommand({
    id: "open-universal-search",
    name: "Knowledge Library: Open universal search",
    callback: () => {
      void plugin.openUniversalSearch().catch((error) => new Notice(error instanceof Error ? error.message : "Unable to open universal search."));
    }
  });

  plugin.addCommand({
    id: "save-current-search",
    name: "Knowledge Library: Save current search",
    callback: () => {
      void plugin.saveCurrentUniversalSearch().catch((error) => new Notice(error instanceof Error ? error.message : "Unable to save current search."));
    }
  });

  plugin.addCommand({
    id: "manage-saved-searches",
    name: "Knowledge Library: Manage saved searches",
    callback: () => plugin.manageSavedSearches()
  });

  plugin.addCommand({
    id: "open-unified-dashboard",
    name: "Knowledge Library: Open unified dashboard",
    callback: () => {
      void plugin.openDashboardView().catch((error) => {
        new Notice(error instanceof Error ? error.message : "Unable to open unified dashboard.");
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
