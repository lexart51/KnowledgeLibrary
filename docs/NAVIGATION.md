# Navigation

KnowledgeLibrary 6.5.0-alpha.5 keeps Home as the default navigator and adds a shared navigation shell across the major KnowledgeLibrary views.

## Entry Points

- `Knowledge Library: Home` opens the Home view.
- The ribbon icon opens the configured default startup page, which defaults to Home.
- `Knowledge Library: Open Library` still opens the existing Library view.
- `Knowledge Library: Open universal search` still opens Universal Search directly.
- `Knowledge Library: Topics` opens the persistent Topics fallback view.
- `Knowledge Library: Open topic page` opens the quick picker and falls back to Topics if the modal does not initialize.
- `Knowledge Library: Test Topic Navigation` reports discovery, picker, Topic view, navigation shell, and index availability.

## Home Shortcuts

Home shortcuts route to existing workflows:

- Resources, Conversations, and Documents open the Library with role filters.
- Collections opens collection management.
- Dashboard opens the existing Knowledge Dashboard.
- Universal Search opens the native universal search view.
- Settings opens the plugin settings tab when Obsidian exposes the settings API.
- Tag and collection chips open Topic Pages when Topic Pages are enabled.

No connector architecture, storage format, deployment behavior, or external vault write behavior changes are introduced by this navigation layer.

## Shared Navigation Shell

The shell appears in Home, Library, Universal Search, Dashboard, Topic Page, and Topics. It exposes Home, Search, Library, Topics, Collections, Dashboard, Add Resource, and Settings with keyboard-accessible buttons, an active-view indicator, responsive wrapping, Obsidian theme variables, and no horizontal scrolling.

The Topics button uses the quick picker first. If the picker cannot be observed at runtime, KnowledgeLibrary shows a Notice and opens the persistent Topics ItemView instead.