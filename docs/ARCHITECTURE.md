# Architecture

KnowledgeLibrary v6 is a modular Obsidian plugin written in TypeScript and bundled with esbuild. The recommended production architecture is the `6.4.1 LTS` baseline at commit `890ea68`.

## Stable Production Topology

```text
KnowledgeLibrary source repository
        |
        | build/deploy artifacts
        v
YouTubes active vault
        |
        +-- Active-vault resource notes
        |
        +-- Unified metadata index
              |
              +-- YouTubes connector
              +-- AI_Chats connector
              +-- _Docs connector
```

## Path Boundaries

- Source repository: `D:\Dropbox\KnowledgeLibrary`
- Active production vault: `D:\Dropbox\Cursos Livros Instrucoes\YouTubes`
- Conversation vault connector: `D:\Dropbox\AI_Chats`
- Document vault connector: `D:\Dropbox\_Docs`

The source repository is not a vault data folder. The production vault owns the active plugin installation and plugin state.

## Modules

- `src/core`: plugin settings, lifecycle-adjacent primitives, and shared application configuration.
- `src/models`: typed domain models used across services and providers.
- `src/providers`: adapters that supply data to services, including read-only multi-vault connector providers.
- `src/services`: application logic that coordinates providers and models.
- `src/ui`: Obsidian UI integration such as ribbon, status bar, library, dashboard, connector management, and unified search surfaces.
- `src/commands`: command palette registrations and command handlers.
- `src/utils`: small pure utilities shared across modules.

## Multi-Vault Layer

KnowledgeLibrary 6.3.0 added a read-only connector layer for independent vaults. This layer is stable in 6.4.1 LTS. Connectors describe where a vault lives, its role, scan patterns, exclusions, display metadata, and optional default taxonomy mappings.

External connectors are read-only. Connector providers do not create, move, rename, or delete files. External full content is not copied into the index; conversation and document references store metadata, headings where allowed, short excerpts, paths, and open URIs.

The connector layer is split into:

- `VaultConnectorService`: normalizes connector paths, scan patterns, connector configuration, and Obsidian open URIs.
- `VaultAvailabilityService`: reports disabled, missing, inaccessible, and available connector states.
- `ResourceVaultConnector`, `ConversationVaultConnector`, and `DocumentVaultConnector`: read metadata from connected vaults without caching full external content.
- `UnifiedIndexService`: combines active-vault resources and external references into a rebuildable index stored in active-vault plugin data.
- `UnifiedSearchService`: searches unified index fields without network or AI calls.

## Plugin State

Plugin state is stored in the active plugin installation, not in external connected vaults. In 6.4.1, `PluginStateManager` owns state loading, validation, migration, backup, restore, and corruption fallback. Repository wrappers access settings, cache, index, diagnostics, saved searches, and connector configuration.

## Build

`npm run build` bundles `src/main.ts` to `main.js` and copies `src/styles.css` to `styles.css`, matching the files Obsidian expects at the plugin root.

## Universal Search Layer

KnowledgeLibrary 6.4.0 added `SearchRankingService`, `SearchQueryParser`, and `SearchResultScorer` above the unified index. The native Universal Search view consumes the cached index, applies query filters and deterministic ranking, suppresses duplicates at search time, and opens results through existing active-vault or external Obsidian URI behavior.

## 6.5 UI Experiments

The 6.5 Home, Topic Pages, Topic Browser, and navigation shell experiments did not change this stable architecture. They are frozen as design history and are not part of the recommended 6.4.1 production workflow.
