# Universal Search

KnowledgeLibrary 6.4.0 adds `Universal Knowledge Search` as a native Obsidian view opened with `Knowledge Library: Open universal search`.

The view searches the active vault plus all enabled unified-index connectors. It uses the cached unified index in memory and does not rescan connected vaults for each query.

## Behavior

- Search input is focused when the view opens.
- Input is debounced using the Search settings delay.
- Arrow Up and Arrow Down move through results.
- Enter opens the selected result.
- Escape clears the query, then closes the view when the query is already empty.
- Results are compact rows by default.

## Display Modes

- `compact`
- `comfortable`
- `grouped-role`
- `grouped-vault`
- `grouped-source`

Results show source, vault, role, type, platform, creator, tags, collections, excerpt, modified date, favorite/progress/priority when available, and unavailable or missing state when indexed.
