# Issues

## Open

- KnowledgeLibrary 6.3.0 is not deployed to the Obsidian vault yet.
- Deployment scripts are prepared but have not been run against the YouTubes vault in this milestone.
- Migration apply intentionally skips notes requiring manual review; unusual legacy note shapes may need manual cleanup before migration.
- Tag consolidation updates YAML frontmatter tags only.
- Thumbnail repair depends on a usable YouTube video id in URL or metadata. Newly observed YouTube thumbnail rendering issues remain open for a later milestone and were not changed in the 6.1.0 specialized forms milestone.
- Website title extraction is best-effort and falls back to hostname when fetching fails or no `<title>` is available.
- Book creation stores supplied metadata only; no external book metadata API is used yet.
- The frontmatter parser supports the plugin's canonical YAML shape and simple legacy fields; complex arbitrary YAML should be migrated cautiously.

## Fixed in 6.5.0-alpha.4

- `Knowledge Library: Open topic page` now opens a searchable native topic picker instead of silently doing nothing when no topic name is available.
- Topic Page launch now validates missing and invalid topics with Notices, reuses the Topic view leaf, and preserves selected topic state across workspace restoration.
## Fixed in 6.0.0-beta.2

- Knowledge Library card grids can scroll through large libraries.
- Newly added YouTube resources render thumbnails and fall back through deterministic candidates before showing the placeholder.
- Legacy `ia` tags are canonicalized to `ai` and do not appear beside `ai` in library filters or saved frontmatter.

## Fixed in 6.0.0-beta.3

- Local vault files can be added through a searchable file picker without moving or copying the original file.
- File resource cards show file metadata, image thumbnails where available, type placeholders, and missing-file state.
- Duplicate file resources are prevented by normalized vault-relative path and likely moved-file metadata.

## Fixed in 6.0.0-rc.1

- Add Resource modal layout is wider, responsive, and avoids horizontal scrolling.
- Library toolbar and cards have improved spacing, wrapping, type labels, and action alignment.
- Settings are grouped with short descriptions.

## Fixed in 6.0.0-rc.2

- Add Resource modal content no longer exceeds the visible modal width.
- Two-column fields shrink correctly and switch to one column on narrow screens.
- The resource type select is constrained to its field and does not create horizontal overflow.

## Fixed in 6.1.0

- Add Resource now shows specialized fields for each supported resource type instead of one generic form.
- YouTube and Website forms keep metadata fields hidden unless manual editing is requested.
- Add Resource modal height now follows visible content and avoids artificial empty space.

## Fixed in 6.2.0

- The library can now organize resources into collections without separate database files.
- Cards, filters, sorting, and dashboard now account for progress, priority, collections, and missing files.
- Relationships can be edited safely while tolerating missing target resources.


## Fixed in 6.3.0

- Independent resource, conversation, and document vaults can now be represented through read-only connectors.
- Unified search and dashboard can work from active-vault plugin data without writing to external vaults.
- Missing or offline connector paths are reported without blocking available connectors.
## Fixed in 6.4.0

- Large unified indexes no longer have to be navigated only as one mixed card grid.
- Search results are ranked by source-aware relevance and can be filtered with inline query syntax.
- Duplicate active-vault and connector copies are suppressed at search time without modifying source data.
## Fixed in 6.4.1

- Windows deployment no longer replaces the plugin folder or removes `data.json`.
- Plugin state now has schema versioning, migration, backup/restore, and corruption fallback behavior.
- Diagnostics and self-test reports now make plugin storage, connector, index, and saved-search health visible.
## Fixed in 6.5.0-alpha.2

- Home sections no longer show duplicate Active vault and YouTubes connector representations of the same YouTube resource.
- Continue Learning no longer includes every unfinished item when progress is zero and there is no explicit learning signal.
- Home date labels now distinguish last-opened dates from updated dates and avoid misleading invalid date output.
