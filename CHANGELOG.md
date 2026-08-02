# Changelog

## Unreleased

- No unreleased changes.

## 6.5.0-alpha.6

- Made Home the default KnowledgeLibrary entry point for normal plugin opening.
- Updated the shared navigation shell so all major workflows are reachable inside the plugin: Home, Search, Library, Topics, Collections, Dashboard, `+ Add Resource`, and Settings.
- Changed the shell Topics action to open the persistent Topic Browser ItemView instead of a modal-only path.
- Simplified Home by removing redundant local shortcut buttons now covered by the persistent shell.
- Reworked the Dashboard hierarchy so workflow prompts, Continue Learning, Recent Topics, Recent Activity, and Quick Actions appear before statistics.
- Added navigation workflow documentation and regression coverage for shell navigation, active state, Topic Browser access, Home startup, dashboard workflow, and quick actions.
- Updated plugin metadata and status bar label to `6.5.0-alpha.6`.
## 6.5.0-alpha.5

- Added runtime DEBUG diagnostics around Topic command invocation, discovery, picker construction/opening, picker `onOpen`, topic selection, and Topic ItemView activation.
- Added `Knowledge Library: Topics` as a reliable fallback ItemView with search, keyboard navigation, logical counts, and click/Enter Topic Page opening.
- Added a shared KnowledgeLibrary navigation shell to Home, Library, Universal Search, Dashboard, Topic Page, and Topics view without changing dashboard data or connector behavior.
- Added `Knowledge Library: Test Topic Navigation` to report topic discovery, picker, view registration, navigation shell, and unified index availability.
- Root cause: alpha.4 still depended on a modal-only launch path; when the modal layer did not visibly render or did not invoke `onOpen` at runtime, there was no persistent in-workspace fallback surface for topic selection.
- Updated plugin metadata and status bar label to `6.5.0-alpha.5`.

## 6.5.0-alpha.4

- Fixed the `Knowledge Library: Open topic page` command so it opens a searchable native topic picker instead of relying on `window.prompt`.
- Hardened Topic Page launch by validating requested topics, showing clear Notices for empty or invalid cases, reusing the existing Topic view leaf, and persisting `topicName` in workspace view state.
- Root cause: alpha.3 routed the command through a browser prompt and allowed empty topic names into the ItemView path, which could leave users with no visible picker, page, or useful error in Obsidian.
- Updated plugin metadata and status bar label to `6.5.0-alpha.4`.

## 6.5.0-alpha.3

- Added automatically discovered Topic Pages as the central navigation surface for subjects across resources, conversations, documents, collections, timelines, related topics, recent activity, and Continue Learning.
- Added Topic navigation from Home Popular Topics, Library card actions, tag/collection chips, and Universal Search Topic results.
- Added in-memory related-topic calculation from existing metadata only, with no AI, network calls, external writes, migrations, or connector architecture changes.
- Added Topic settings for enablement, default sort, related-topic depth, and timeline length.
- Updated plugin metadata and status bar label to `6.5.0-alpha.3`.

## 6.5.0-alpha.2

- Applied shared duplicate suppression to Home sections so active-vault resources and connector copies appear as one logical item.
- Narrowed Continue Learning to explicit learning signals: partial progress, valid position, recent opens, or high-priority unfinished items.
- Added clearer date labels and logical-item count clarification on Home.
- Updated plugin metadata and status bar label to `6.5.0-alpha.2`.

## 6.5.0-alpha.1

- Added `Knowledge Library: Home` as the navigation-first landing view.
- Added search-first Home navigation into Universal Search.
- Added Continue Learning, Recent Activity, recent role sections, favorite collections, most-used tags, and new-library empty-state actions.
- Added Home settings for Continue Learning, timeline, tag cloud, and default startup page.
- Updated plugin metadata and status bar label to `6.5.0-alpha.1`.

## 6.4.1

- Changed deployment scripts to update only `main.js`, `manifest.json`, and `styles.css`, preserving `data.json` and future plugin state files.
- Added deployment reports with version, timestamp, updated files, preserved files, and warnings.
- Added `PluginStateManager` plus storage repositories for settings, cache, index, diagnostics, saved searches, and connectors.
- Added state schema versioning, automatic migration, unknown-field preservation, backup, restore, and corruption fallback behavior.
- Added diagnostics view, self diagnostics command, and configurable `LoggerService`.
- Added plugin configuration export/import and plugin state backup/restore commands.
- Updated plugin metadata and status bar label to `6.4.1`.
## 6.4.0

- Added the native `Universal Knowledge Search` ItemView with debounced input, focused search, keyboard navigation, compact/grouped result modes, matched-term highlighting, and ecosystem overview counts.
- Added deterministic `SearchRankingService`, `SearchQueryParser`, and `SearchResultScorer` with source-aware boosts, penalties, query filters, and duplicate suppression.
- Added saved searches stored only in plugin data plus commands to save and manage them.
- Improved library ecosystem navigation with role tabs and clearer source-aware filtering.
- Extended the dashboard with a Universal Search action, unified role/connector counts, and recent items by role.
- Added search settings for display mode, result limit, debounce, ranking boosts, duplicate suppression, excerpts, grouping, and saved searches.
- Updated plugin metadata and status bar label to `6.4.0`.
## 6.3.0

- Added disabled example multi-vault connector configuration for resource, conversation, and document vaults.
- Added read-only connector services, path availability checks, resource/conversation/document connector providers, and Obsidian URI generation.
- Added unified index and search services that combine active-vault resources with external metadata references while tolerating connector failures.
- Extended the library with source, vault, and role filters plus external resource cards and open actions.
- Extended the dashboard with connector status, indexed counts, errors, role/vault/platform counts, and refresh/rebuild actions.
- Added connector management settings and commands for managing, testing, refreshing, rebuilding, searching, and opening the unified dashboard.
- Added multi-vault, connectors, unified index, unified search, and privacy documentation.
- Updated plugin metadata and status bar label to `6.3.0`.
## 6.2.0

- Added optional resource frontmatter for collections, progress tracking, priority, and typed related-resource relationships.
- Added `CollectionService`, `ProgressService`, and `RelationshipService` with normalization, planning, validation, and relationship lookup rules.
- Added collection, priority, and progress filters; progress/priority sorting; collection badges; priority indicators; progress bars; and quick progress edits to library cards.
- Added Manage collections, Edit selected resource, and Knowledge Dashboard commands using existing vault resource notes only.
- Added 6.2.0 documentation for collections, progress, relationships, and dashboard.
- Updated plugin metadata and status bar label to `6.2.0`.

## 6.1.0

- Replaced the generic Add Resource form with specialized forms for YouTube, websites, PDFs, books, PowerPoint, Word/Text documents, Markdown, images, scripts, skills, archives, and other resources.
- Kept a single Add Resource modal shell and shared AddResourceService, ProviderRegistry, ResourceService, and VaultResourceRepository creation pipeline.
- Added natural-height modal behavior so the footer follows visible form content and the modal scrolls vertically only when needed.
- Added type-specific validation, optional manual metadata disclosures for YouTube and Website, and focused file metadata fields for local vault file resources.
- Updated plugin metadata and status bar label to `6.1.0`.

## 6.0.0-rc.2

- Fixed Add Resource modal horizontal overflow by using viewport-safe modal sizing, shrink-safe grid columns, full-width rows, and vertical-only modal scrolling.
- Constrained the native resource type selector and reinforced responsive one-column behavior at narrow widths.
- Updated plugin metadata and status bar label to `6.0.0-rc.2`.

## 6.0.0-rc.1

- Polished the Add Resource modal with a wider responsive layout, prominent vault file picker, inline field validation, constrained controls, sticky actions, and accessibility labels.
- Refined the library layout with responsive toolbar groups, resource-type badges, consistent cards, bottom-aligned actions, improved missing-file state, and preserved vertical scrolling.
- Grouped settings into Storage, Display, File resources, Tags, and Migration and safety without changing existing setting keys or defaults.
- Added UI/UX regression tests for modal structure, responsive classes, toolbar wrapping, card classes, accessibility labels, theme-variable CSS, density classes, and scroll behavior.
- Updated plugin metadata and status bar label to `6.0.0-rc.1`.

## 6.0.0-beta.3

- Added first-class local vault file resources for PDFs, PowerPoint, Word/Text documents, EPUB books, Markdown, images, scripts, archives, and unknown files.
- Added searchable vault file picker filtering, type override, deterministic file IDs, duplicate and moved-file detection, and file metadata storage.
- Added image thumbnails for vault image resources, type placeholders for other files, open-original-file actions, missing-file filtering, and drag-and-drop prefill.
- Added settings for allowed extensions, excluded folders, file-size display, drag/drop, and unknown file type defaults.
- Updated docs for file resources, file picker behavior, and drag-and-drop.
- Updated plugin metadata and status bar label to `6.0.0-beta.3`.

## 6.0.0-beta.2

- Fixed the Knowledge Library `ItemView` to render through Obsidian `contentEl` and use a dedicated scroll container for large card grids.
- Fixed YouTube card thumbnails to render `resource.thumbnail` first, then advance through `i.ytimg.com` candidates on image load failures.
- Consolidated legacy `ia` tags into canonical `ai` across creation, reads, filtering, analysis, migration apply, consolidation, and serialization.
- Updated plugin metadata and status bar label to `6.0.0-beta.2`.

## 6.0.0-beta.1

- Promoted KnowledgeLibrary v6 metadata to `6.0.0-beta.1` with plugin id `knowledge-library-v6`.
- Added `build:prod` and Windows/Linux deployment scripts that deploy only `main.js`, `manifest.json`, and `styles.css` into a side-by-side v6 plugin folder.
- Added safe migration backup and apply services with dry-run planning, confirmation, body preservation, canonical frontmatter writes, and Markdown reports.
- Added tag alias analysis and consolidation with preview, confirmation, duplicate canonical tag prevention, and reports.
- Added deterministic YouTube thumbnail repair with preview, confirmation, reports, and Hermes video-id test coverage.
- Added deployment, migration apply, tag manager, and thumbnail repair documentation.
- Added a unified native Add Resource modal for YouTube, websites, books, vault files, and common file-backed resource types.
- Added `AddResourceService` to route all wizard creation through `ProviderRegistry`, `ResourceService`, and `VaultResourceRepository`.
- Added duplicate prevention by YouTube video id, website canonical URL, and vault file path.
- Added website title extraction through Obsidian `requestUrl` with graceful hostname fallback.
- Added file extension detection for PDF, PowerPoint, Markdown, image, script, archive, and other resources.
- Added default-tag and canonical tag handling in the wizard creation flow.
- Added automatic refresh for open Knowledge Library views and note opening after creation or duplicate detection.
- Added tests for wizard creation, deduplication, tag canonicalization, file type detection, and oEmbed fallback behavior.
- Added a read-only `MigrationService` for analyzing existing vault resources.
- Added a compatibility layer for Video Knowledge Manager notes, Knowledge Library v5 notes, legacy WhatsApp imported notes, and KnowledgeLibrary v6 notes.
- Added in-memory conversion of compatible legacy resources to `KnowledgeResource`.
- Added audit reporting for totals, duplicate ids, duplicate YouTube ids, missing thumbnails, unavailable resources, orphan notes, legacy fields, invalid YAML, and invalid URLs.
- Added migration simulation reporting for detected, ignored, convertible, and manual-review resources.
- Added commands for `Knowledge Library: Analyze existing vault` and `Knowledge Library: Simulate migration`.
- Added an Obsidian HTML report modal for migration analysis and simulation results.
- Added migration compatibility tests.

## 6.0.0-alpha

- Added settings-driven vault storage defaults for the library and resources folders.
- Added `VaultResourceRepository`, `ResourceSerializer`, and `ResourceDeserializer`.
- Added Markdown resource note serialization with canonical YAML frontmatter.
- Added legacy frontmatter reads for `video_id`, `channel`, `image`, `watched`, `date_added`, and `date_shared`.
- Added provider-specific deduplication and YouTube video id lookup.
- Added the first native Knowledge Library `ItemView` with search, filters, sorting, card grid, note/resource actions, favorite/completed toggles, refresh, and visible item count.
- Added YouTube thumbnail fallback generation for `hqdefault.jpg`, `0.jpg`, and `mqdefault.jpg`.
- Added tests for storage serialization, legacy conversion, exclusions, deduplication, and thumbnail fallbacks.
- Added the Milestone 1 resource core with `KnowledgeResource`, provider interface, provider registry, resource service, tag service integration, and in-memory resource cache.
- Added YouTube, website, and file providers.
- Added YouTube URL canonicalization, deterministic thumbnails, and graceful oEmbed fallback behavior.
- Added unit tests for YouTube normalization, canonical tag behavior, duplicate removal, and provider selection.
- Added resource model and provider documentation.
- Initialized the KnowledgeLibrary v6 Obsidian plugin architecture.
- Added a minimal plugin lifecycle with ribbon, command, and status bar registration.
- Added the first canonical tag alias service.
