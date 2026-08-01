# Issues

## Open

- Deployment scripts are prepared but have not been run against the YouTubes vault in this milestone.
- Migration apply intentionally skips notes requiring manual review; unusual legacy note shapes may need manual cleanup before migration.
- Tag consolidation updates YAML frontmatter tags only.
- Thumbnail repair depends on a usable YouTube video id in URL or metadata.
- Website title extraction is best-effort and falls back to hostname when fetching fails or no `<title>` is available.
- Book creation stores supplied metadata only; no external book metadata API is used yet.
- The frontmatter parser supports the plugin's canonical YAML shape and simple legacy fields; complex arbitrary YAML should be migrated cautiously.
