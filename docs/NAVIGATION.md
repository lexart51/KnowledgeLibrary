# Navigation

KnowledgeLibrary 6.5.0-alpha.1 shifts the default experience from opening the flat Library first to opening a Home navigator first.

## Entry Points

- `Knowledge Library: Home` opens the Home view.
- The ribbon icon opens the configured default startup page, which defaults to Home.
- `Knowledge Library: Open Library` still opens the existing Library view.
- `Knowledge Library: Open universal search` still opens Universal Search directly.

## Home Shortcuts

Home shortcuts route to existing workflows:

- Resources, Conversations, and Documents open the Library with role filters.
- Collections opens collection management.
- Dashboard opens the existing Knowledge Dashboard.
- Universal Search opens the native universal search view.
- Settings opens the plugin settings tab when Obsidian exposes the settings API.
- Tag and collection chips open the Library with the corresponding filter.

No connector architecture, storage format, deployment behavior, or external vault write behavior changes are introduced by this navigation layer.