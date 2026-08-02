# Navigation Shell

KnowledgeLibrary 6.5.0-alpha.6 makes the plugin navigation-first. Normal plugin workflows should be reachable from the plugin UI itself; command palette commands remain as advanced shortcuts.

## Persistent Sections

The shared shell appears at the top of the major KnowledgeLibrary surfaces:

- Home
- Universal Search
- Library
- Topics
- Collections
- Dashboard
- Settings

The shell also exposes a persistent `+ Add Resource` action. It uses Obsidian theme variables, wraps on narrow panes, preserves visible focus, and avoids horizontal scrolling.

## Behavior

- Home opens the Knowledge Navigator Home view.
- Search opens Universal Knowledge Search.
- Library opens the resource browsing view.
- Topics opens the Topic Browser ItemView, not a modal.
- Collections opens collection management.
- Dashboard opens the workflow-oriented dashboard.
- `+ Add Resource` opens the existing Add Resource modal and preserves the existing service pipeline.
- Settings opens the KnowledgeLibrary settings tab.

The active section is marked with `aria-current="page"` and the `is-active` class.

## Scope

This release does not change connector architecture, storage, deployment, migration, PluginStateManager, unified index behavior, Universal Search ranking, or Topic discovery. It only rearranges how existing capabilities are reached.
