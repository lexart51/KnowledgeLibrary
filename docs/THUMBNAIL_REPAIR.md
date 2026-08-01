# Thumbnail Repair

Milestone 5 adds deterministic YouTube thumbnail repair.

## Command

- `Knowledge Library: Repair YouTube thumbnails`

The command detects YouTube resource notes with missing or unusable thumbnail values, previews the repairs, and requires confirmation before writing.

## Behavior

Repair uses the YouTube video id already present in the resource URL or metadata. It does not fetch remote metadata and does not mark a resource unavailable when remote metadata is unavailable.

The repaired thumbnail uses:

```text
https://img.youtube.com/vi/<videoId>/hqdefault.jpg
```

The resource metadata also stores fallback candidates for `hqdefault.jpg`, `0.jpg`, and `mqdefault.jpg`.
