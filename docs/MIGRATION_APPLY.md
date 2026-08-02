# Migration Apply

This is stable 6.4.1-compatible documentation for explicit, confirmation-gated migration writes. No migration runs on plugin load.


Milestone 5 adds controlled migration writes. No migration runs during plugin load.

## Commands

- `Knowledge Library: Create migration backup`
- `Knowledge Library: Apply migration`

Both commands first compute a dry-run plan and require explicit confirmation before writing.

## Backup

Migration backups copy every note that would be changed into a timestamped safety folder outside the active library folder:

```text
<library root> - KnowledgeLibrary v6 Safety/Migration Backups/<timestamp>
```

## Apply Rules

Migration updates only YAML frontmatter and preserves user Markdown content below the frontmatter block.

It adds or normalizes:

- `schema_version`
- `resource_id`
- `type`
- `completed` from legacy `watched`
- `creator` from legacy `channel` when needed
- `thumbnail` from legacy `image` when needed
- canonical tags, including `ia` to `ai`

Migration never deletes resource notes and skips every note requiring manual review.

## Reports

Apply and backup operations produce Markdown reports with changed, skipped, failed, and manual-review items.
