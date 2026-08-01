# Backup and Restore

KnowledgeLibrary 6.4.1 adds plugin-state backup, restore, export, and import commands.

Commands:

- `Knowledge Library: Export plugin configuration`
- `Knowledge Library: Import plugin configuration`
- `Knowledge Library: Backup plugin state`
- `Knowledge Library: Restore plugin state`

Configuration export is a single JSON document containing settings, connectors, saved searches, collection configuration, and plugin preferences. It intentionally excludes cache and unified index data.

Backups are stored in plugin state and keep recent recoverable state snapshots. Restores update plugin state only and do not modify resource notes or connected external vaults.
