# Changelog

## Unreleased

- Added settings-driven vault storage defaults for the library and resources folders.
- Added `VaultResourceRepository`, `ResourceSerializer`, and `ResourceDeserializer`.
- Added Markdown resource note serialization with canonical YAML frontmatter.
- Added legacy frontmatter reads for `video_id`, `channel`, `image`, `watched`, `date_added`, and `date_shared`.
- Added provider-specific deduplication and YouTube video id lookup.
- Added the first native Knowledge Library `ItemView` with search, filters, sorting, card grid, note/resource actions, favorite/completed toggles, refresh, and visible item count.
- Added YouTube thumbnail fallback generation for `hqdefault.jpg`, `0.jpg`, and `mqdefault.jpg`.
- Added tests for storage serialization, legacy conversion, exclusions, deduplication, and thumbnail fallbacks.

## 6.0.0-alpha

- Added the Milestone 1 resource core with `KnowledgeResource`, provider interface, provider registry, resource service, tag service integration, and in-memory resource cache.
- Added YouTube, website, and file providers.
- Added YouTube URL canonicalization, deterministic thumbnails, and graceful oEmbed fallback behavior.
- Added unit tests for YouTube normalization, canonical tag behavior, duplicate removal, and provider selection.
- Added resource model and provider documentation.
- Initialized the KnowledgeLibrary v6 Obsidian plugin architecture.
- Added a minimal plugin lifecycle with ribbon, command, and status bar registration.
- Added the first canonical tag alias service.
