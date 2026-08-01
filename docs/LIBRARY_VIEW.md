# Library View

The first Knowledge Library view is a native Obsidian `ItemView` registered as `knowledge-library-view`.

## Entry Points

- Ribbon icon: opens the Knowledge Library view.
- Command palette: `Knowledge Library: Open Library` opens the same view.

## Controls

The view includes:

- Search input
- Type filter
- Tag filter
- Status filter
- Favorites filter
- Completed filter
- Sort by recently updated or title
- Refresh button
- Visible item count

## Cards

Resources render in a card grid. Cards show a thumbnail for image-backed resources, YouTube thumbnails when available, or a compact placeholder for non-image resources.

Each card includes actions to open the note, open the external resource, toggle favorite, and toggle completed.

## YouTube Thumbnail Fallbacks

The view renders `resource.thumbnail` first. If loading fails, YouTube resources try provider-generated thumbnails in order:

1. `hqdefault.jpg`
2. `0.jpg`
3. `mqdefault.jpg`

If all image candidates fail, the card shows the placeholder.
