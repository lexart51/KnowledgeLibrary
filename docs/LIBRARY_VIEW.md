# Library View

The first Knowledge Library view is a native Obsidian `ItemView` registered as `knowledge-library-view`. It renders inside Obsidian `contentEl` and uses a dedicated `.knowledge-library-scroll` content area so large libraries can scroll vertically through all cards.

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

The view renders `resource.thumbnail` first. If loading fails, YouTube resources try provider-generated thumbnails in order, without duplicate URLs:

1. Current `resource.thumbnail` value
2. `https://i.ytimg.com/vi/<video_id>/hqdefault.jpg`
3. `https://i.ytimg.com/vi/<video_id>/0.jpg`
4. `https://i.ytimg.com/vi/<video_id>/mqdefault.jpg`

If all image candidates fail, the card shows the placeholder.
