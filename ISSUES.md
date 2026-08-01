# Issues

## Open

- v6 beta.2 is not deployed to the Obsidian vault yet.
- Deployment scripts are prepared but have not been run against the YouTubes vault in this milestone.
- Migration apply intentionally skips notes requiring manual review; unusual legacy note shapes may need manual cleanup before migration.
- Tag consolidation updates YAML frontmatter tags only.
- Thumbnail repair depends on a usable YouTube video id in URL or metadata.
- Website title extraction is best-effort and falls back to hostname when fetching fails or no `<title>` is available.
- Book creation stores supplied metadata only; no external book metadata API is used yet.
- The frontmatter parser supports the plugin's canonical YAML shape and simple legacy fields; complex arbitrary YAML should be migrated cautiously.

## Fixed in 6.0.0-beta.2

- Knowledge Library card grids can scroll through large libraries.
- Newly added YouTube resources render thumbnails and fall back through deterministic candidates before showing the placeholder.
- Legacy `ia` tags are canonicalized to `ai` and do not appear beside `ai` in library filters or saved frontmatter.
