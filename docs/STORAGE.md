# Storage

KnowledgeLibrary v6 stores resources as Markdown notes with YAML frontmatter. Storage paths are settings-driven and do not depend on any specific existing vault.

## Default Paths

- Library folder: `01 - Biblioteca`
- Resources folder: `01 - Biblioteca/Recursos`

Both paths can be changed in plugin settings.

## Frontmatter Format

Resource notes use these canonical fields:

- `schema_version`
- `resource_id`
- `type`
- `title`
- `creator`
- `source`
- `url`
- `file_path`
- `thumbnail`
- `tags`
- `status`
- `favorite`
- `completed`
- `rating`
- `created_at`
- `updated_at`
- `metadata`

## Backward Compatibility

The deserializer reads legacy fields without modifying files during simple reads:

- `video_id` maps into `metadata.videoId`
- `channel` is used as `creator` when `creator` is missing
- `image` is used as `thumbnail` when `thumbnail` is missing
- `watched` maps to `completed`
- `date_added` and `date_shared` can seed `created_at`

## Repository Behavior

`VaultResourceRepository` scans configured folders, ignores backup/quarantine/report/template/system paths, creates and updates resource notes, finds resources by id, finds YouTube resources by video id, and deduplicates by provider-specific keys.

Updates rewrite canonical frontmatter while preserving user-written Markdown sections below the frontmatter block and unrelated/unknown frontmatter keys. Collections and relationships are stored in the resource note frontmatter; no separate proprietary database files are used.
