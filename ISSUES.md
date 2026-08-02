# Issues

## Production 6.4.1

No known production blocker is currently documented for the recommended `6.4.1 LTS` installation.

Known non-blocking limitations:

- Migration apply intentionally skips notes requiring manual review; unusual legacy note shapes may need manual cleanup before migration.
- Tag consolidation updates YAML frontmatter tags only.
- Thumbnail repair depends on a usable YouTube video id in URL or metadata.
- Website title extraction is best-effort and falls back to hostname when fetching fails or no `<title>` is available.
- Book creation stores supplied metadata only; no external book metadata API is used.
- The frontmatter parser supports the plugin's canonical YAML shape and simple legacy fields; complex arbitrary YAML should be migrated cautiously.
- Universal Search uses metadata, headings, excerpts, and paths from the unified index; it does not index full conversation or document content.
- Connectors are read-only and report missing/offline paths instead of attempting repair.

## Experimental 6.5

The 6.5 alpha line is not approved for production.

Known blockers and unresolved risks:

- Topic Page launch failures occurred in the alpha line, including command paths that produced no visible page, modal, Notice, or useful error.
- Modal-only access was too weak for primary navigation.
- Before shell work, normal topic navigation still depended too heavily on Ctrl+P and command-palette access.
- The persistent navigation shell in `6.5.0-alpha.6` caused a runtime interface lock after navigating between major views.
- `6.5.0-alpha.6` is not production ready and must not be deployed to the daily-use YouTubes vault.
- Future UX work needs design-first prototypes, branch isolation, and real Obsidian acceptance testing.

## Historical Fixed Issues

### Fixed in 6.5.0-alpha.5 - Experimental Only

- Topic navigation no longer depended only on a modal in the experimental source line; the `Knowledge Library: Topics` ItemView provided a persistent fallback if the quick picker failed to render.
- Topic picker and Topic Page launches emitted DEBUG diagnostics through `LoggerService` and showed Notices for discovery, picker, and view initialization failures.
- A shared navigation shell exposed Topics from Home, Library, Search, Dashboard, and Topic views.

These fixes did not make the 6.5 line production-ready because alpha.6 later showed a blocking runtime navigation lock.

### Fixed in 6.5.0-alpha.4 - Experimental Only

- `Knowledge Library: Open topic page` opened a searchable native topic picker instead of silently doing nothing when no topic name was available.
- Topic Page launch validated missing and invalid topics with Notices, reused the Topic view leaf, and preserved selected topic state across workspace restoration.

### Fixed in 6.5.0-alpha.2 - Experimental Only

- Home sections no longer showed duplicate Active vault and YouTubes connector representations of the same YouTube resource.
- Continue Learning no longer included every unfinished item when progress was zero and there was no explicit learning signal.
- Home date labels distinguished last-opened dates from updated dates and avoided misleading invalid date output.

### Fixed in 6.4.1

- Windows deployment no longer replaces the plugin folder or removes `data.json`.
- Plugin state has schema versioning, migration, backup/restore, and corruption fallback behavior.
- Diagnostics and self-test reports make plugin storage, connector, index, and saved-search health visible.
- Release version synchronization was corrected so package, manifest, compiled bundle, status label, and deployment reports agree.

### Fixed in 6.4.0

- Large unified indexes no longer have to be navigated only as one mixed card grid.
- Search results are ranked by source-aware relevance and can be filtered with inline query syntax.
- Duplicate active-vault and connector copies are suppressed at search time without modifying source data.

### Fixed in 6.3.0

- Independent resource, conversation, and document vaults can be represented through read-only connectors.
- Unified search and dashboard can work from active-vault plugin data without writing to external vaults.
- Missing or offline connector paths are reported without blocking available connectors.

### Fixed in 6.2.0

- The library can organize resources into collections without separate database files.
- Cards, filters, sorting, and dashboard account for progress, priority, collections, and missing files.
- Relationships can be edited safely while tolerating missing target resources.

### Fixed in 6.1.0

- Add Resource shows specialized fields for each supported resource type instead of one generic form.
- YouTube and Website forms keep metadata fields hidden unless manual editing is requested.
- Add Resource modal height follows visible content and avoids artificial empty space.

### Fixed in 6.0.0-rc.2

- Add Resource modal content no longer exceeds the visible modal width.
- Two-column fields shrink correctly and switch to one column on narrow screens.
- The resource type select is constrained to its field and does not create horizontal overflow.

### Fixed in 6.0.0-rc.1

- Add Resource modal layout is wider, responsive, and avoids horizontal scrolling.
- Library toolbar and cards have improved spacing, wrapping, type labels, and action alignment.
- Settings are grouped with short descriptions.

### Fixed in 6.0.0-beta.3

- Local vault files can be added through a searchable file picker without moving or copying the original file.
- File resource cards show file metadata, image thumbnails where available, type placeholders, and missing-file state.
- Duplicate file resources are prevented by normalized vault-relative path and likely moved-file metadata.

### Fixed in 6.0.0-beta.2

- Knowledge Library card grids can scroll through large libraries.
- Newly added YouTube resources render thumbnails and fall back through deterministic candidates before showing the placeholder.
- Legacy `ia` tags are canonicalized to `ai` and do not appear beside `ai` in library filters or saved frontmatter.
