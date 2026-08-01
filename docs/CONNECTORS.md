# Vault Connectors

A vault connector has:

- `id`
- `displayName`
- `role`
- `windowsPath`
- optional `linuxPath`
- optional configured `vaultName`
- `enabled`
- `includePatterns`
- `excludePatterns`
- `preferredNoteType`
- `icon`
- `colorToken`
- optional default collection mapping

## Path Safety

Paths are normalized across Windows and Linux. Missing, offline, disabled, or inaccessible connectors are reported and do not block indexing of available connectors.

Connector scans skip `.obsidian`, hidden folders, backups, quarantine, reports, templates, `node_modules`, `.git`, and plugin build folders. Per-connector exclusions are applied in addition to built-in exclusions.

## Management

Use `Knowledge Library: Manage vault connectors` or the Vault connectors settings group to add, edit, enable, disable, test, or remove connector configuration. Removing a connector deletes configuration only; it never deletes files.
