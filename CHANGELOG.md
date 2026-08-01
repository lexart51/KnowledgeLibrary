# Changelog

## Unreleased

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
