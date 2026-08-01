# Architecture

KnowledgeLibrary v6 is organized as a modular Obsidian plugin written in TypeScript and bundled with esbuild.

## Modules

- `src/core`: plugin settings, lifecycle-adjacent primitives, and shared application configuration.
- `src/models`: typed domain models used across services and providers.
- `src/providers`: adapters that supply data to services, including read-only multi-vault connector providers.
- `src/services`: application logic that coordinates providers and models.
- `src/ui`: Obsidian UI integration such as ribbon, status bar, library, dashboard, connector management, and unified search surfaces.
- `src/commands`: command palette registrations and command handlers.
- `src/utils`: small pure utilities shared across modules.

## Multi-Vault Layer

KnowledgeLibrary 6.3.0 adds a read-only connector layer for independent vaults. Connectors describe where a vault lives, its role, scan patterns, exclusions, display metadata, and optional default taxonomy mappings. External vaults are never merged physically and connector providers do not create, move, rename, or delete files.

The connector layer is split into:

- `VaultConnectorService`: normalizes connector paths, scan patterns, connector configuration, and Obsidian open URIs.
- `VaultAvailabilityService`: reports disabled, missing, inaccessible, and available connector states.
- `ResourceVaultConnector`, `ConversationVaultConnector`, and `DocumentVaultConnector`: read metadata from connected vaults without caching full external content.
- `UnifiedIndexService`: combines active-vault resources and external references into a rebuildable index stored in active-vault plugin data.
- `UnifiedSearchService`: searches unified index fields without network or AI calls.

## Build

`npm run build` bundles `src/main.ts` to `main.js` and copies `src/styles.css` to `styles.css`, matching the files Obsidian expects at the plugin root.
## Universal Search Layer

KnowledgeLibrary 6.4.0 adds `SearchRankingService`, `SearchQueryParser`, and `SearchResultScorer` above the unified index. The native Universal Search view consumes the cached index, applies query filters and deterministic ranking, suppresses duplicates at search time, and opens results through existing active-vault or external Obsidian URI behavior.
## Maintenance Storage Layer

KnowledgeLibrary 6.4.1 centralizes plugin state access under `src/services/PluginStorage`. `PluginStateManager` is the only layer that calls Obsidian plugin data load/save APIs. Settings, cache, unified index, diagnostics, saved searches, and connectors are accessed through repository classes so future state files and schema migrations can evolve without scattering storage logic.

`LoggerService` provides configurable logging with production debug suppression. `DiagnosticsService` collects read-only runtime health information and runs self diagnostics without touching external vaults.
