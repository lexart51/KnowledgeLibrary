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
- Collection filter
- Priority filter
- Progress filter for not started, in progress, and completed
- Favorites filter
- Completed filter
- Sort by progress, priority, recently added, recently updated, or title
- Refresh button
- Visible item count

## Cards

Resources render in a card grid. Cards show a thumbnail for image-backed resources, YouTube thumbnails when available, or a compact placeholder for non-image resources.

Each card includes type and priority badges, collection badges, a compact progress bar when progress is greater than zero, and actions to open the note, open the external resource, toggle favorite, toggle completed, and quick-edit progress.

## YouTube Thumbnail Fallbacks

The view renders `resource.thumbnail` first. If loading fails, YouTube resources try provider-generated thumbnails in order, without duplicate URLs:

1. Current `resource.thumbnail` value
2. `https://i.ytimg.com/vi/<video_id>/hqdefault.jpg`
3. `https://i.ytimg.com/vi/<video_id>/0.jpg`
4. `https://i.ytimg.com/vi/<video_id>/mqdefault.jpg`

If all image candidates fail, the card shows the placeholder.

## Dashboard

Knowledge Library: Open Dashboard opens a lightweight dashboard view with counts by type and collection, progress buckets, favorites, high-priority resources, missing files, and recent additions/updates. It reads existing vault data only.
