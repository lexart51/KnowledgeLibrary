# Navigation

KnowledgeLibrary 6.5.0-alpha.6 keeps Home as the default navigator and makes the shared navigation shell the primary way to reach normal plugin workflows.

## Entry Points

- The ribbon icon opens Home for the normal KnowledgeLibrary entry flow.
- `Knowledge Library: Home` opens the Home view.
- `Knowledge Library: Open Library` still opens the resource Library directly.
- `Knowledge Library: Open universal search` still opens Universal Search directly.
- `Knowledge Library: Topics` opens the persistent Topic Browser view.
- `Knowledge Library: Open topic page` opens the quick picker and falls back to Topics if the modal does not initialize.
- `Knowledge Library: Test Topic Navigation` reports discovery, picker, Topic view, navigation shell, and index availability.

Command palette commands remain available for hotkeys and advanced use. Normal navigation is available inside the plugin UI.

## Shared Navigation Shell

The shell appears in Home, Library, Universal Search, Dashboard, Topic Page, Topics, Collections management, and Settings. It exposes Home, Search, Library, Topics, Collections, Dashboard, `+ Add Resource`, and Settings with keyboard-accessible buttons, an active-view indicator, responsive wrapping, Obsidian theme variables, and no horizontal scrolling.

The Topics button opens the persistent Topic Browser ItemView. The command palette quick picker remains available as a shortcut.

No connector architecture, storage format, deployment behavior, external vault write behavior, Topic engine behavior, or Universal Search ranking changes are introduced by this navigation layer.
