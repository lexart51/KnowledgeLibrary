# Plugin State

This document describes the `6.4.1 LTS` production state layer. It is part of the recommended stable baseline.


KnowledgeLibrary 6.4.1 introduces `PluginStateManager` and schema-managed plugin state.

Current state includes:

- `state_version`
- `plugin_version`
- user settings
- connector configuration
- saved searches
- unified index cache
- diagnostics metadata
- state backups

The on-disk shape remains backward-compatible with existing `data.json` state. Unknown fields are preserved during migration and save operations.

## Migration

State loading validates the data object, upgrades old or missing `state_version` values sequentially, writes upgraded state, and falls back to defaults if the state cannot be read safely.
