# Architecture

KnowledgeLibrary v6 is organized as a modular Obsidian plugin written in TypeScript and bundled with esbuild.

## Modules

- `src/core`: plugin settings, lifecycle-adjacent primitives, and shared application configuration.
- `src/models`: typed domain models used across services and providers.
- `src/providers`: adapters that supply data to services.
- `src/services`: application logic that coordinates providers and models.
- `src/ui`: Obsidian UI integration such as ribbon and status bar elements.
- `src/commands`: command palette registrations and command handlers.
- `src/utils`: small pure utilities shared across modules.

## Build

`npm run build` bundles `src/main.ts` to `main.js` and copies `src/styles.css` to `styles.css`, matching the files Obsidian expects at the plugin root.
