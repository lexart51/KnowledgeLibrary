# Issues

## Open

- Website title extraction is best-effort and falls back to hostname when fetching fails or no `<title>` is available.
- Book creation stores supplied metadata only; no external book metadata API is used yet.
- Migration analysis is intentionally read-only; a future milestone must add explicit opt-in write behavior for migration execution.
- Legacy format detection is heuristic and may require manual review for unusual historical note shapes.
- YouTube oEmbed metadata depends on network availability and may fall back to generic resource details.
- Resource note creation and updates are implemented, but Milestone 4 intentionally does not deploy or install the plugin into an Obsidian vault.
- The frontmatter parser supports the plugin's canonical YAML shape and simple legacy fields; complex arbitrary YAML should be migrated cautiously.
