# Collections

KnowledgeLibrary 6.2.0 stores collections directly in each resource note frontmatter:

```yaml
collections:
  - Research
  - Courses
```

Collection names are normalized by trimming whitespace, collapsing repeated spaces, and deduplicating case-insensitively. Collections are not stored in a separate database.

## Library Usage

The main library toolbar includes a Collection filter. Cards show compact collection badges for assigned collections.

## Add and Edit Resource

All Add Resource forms include a Collections field. Enter one or more comma-separated collection names. New collection names are created by assigning them to a resource.

The resource editor can update collections for the selected resource only.

## Management

`Knowledge Library: Manage collections` opens a native management modal with collection names, item counts, rename, merge, and remove-association actions.

Rename and merge operations preview exact affected notes and require confirmation. Deleting/removing a collection removes the association from resource frontmatter only; it never deletes resource notes.

Bulk collection operations write a Markdown report under `KnowledgeLibrary Reports`.
