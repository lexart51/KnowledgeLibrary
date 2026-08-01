# Migration and Compatibility

Milestone 3 adds a read-only migration layer for using the existing YouTubes vault content as the first production dataset for KnowledgeLibrary v6.

## Commands

- `Knowledge Library: Analyze existing vault`
- `Knowledge Library: Simulate migration`

Both commands scan Markdown notes and display an HTML report inside Obsidian. Neither command writes, modifies, renames, or moves any file.

## Detected Formats

The compatibility layer detects:

- Video Knowledge Manager notes, using signals such as `video_id`, `channel`, `watched`, and related source/path markers.
- Knowledge Library v5 notes, using signals such as `kl_version`, `knowledge_library_version`, Knowledge Library source markers, v5 paths, and compatible URL/type fields.
- Legacy WhatsApp imported notes, using signals such as `date_shared`, WhatsApp source/path/body markers, and shared URLs.
- KnowledgeLibrary v6 notes, using `resource_id` or `schema_version: 2`.

## In-Memory Conversion

Compatible notes are converted into `KnowledgeResource` objects in memory. Legacy fields are mapped through the existing deserializer where possible:

- `video_id` -> `metadata.videoId`
- `channel` -> `creator`
- `image` -> `thumbnail`
- `watched` -> `completed`
- `date_added` / `date_shared` -> `createdAt`

The original note path and detected legacy kind are attached to `metadata` for audit traceability.

## Audit Report

The audit report shows:

- Total resources
- Duplicated resource ids
- Duplicated YouTube ids
- Missing thumbnails
- Unavailable resources
- Orphan notes
- Legacy fields still present
- Invalid YAML
- Invalid URLs

## Simulation Report

The simulation report shows:

- Resources detected
- Resources ignored
- Resources that would be converted
- Resources requiring manual review

Manual review is required for invalid YAML, invalid URLs, missing thumbnails, unavailable resources, and provider-specific duplicates.
