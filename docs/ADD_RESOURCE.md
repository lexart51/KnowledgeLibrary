# Add Resource Wizard

Version 6.1.0 replaces the generic Add Resource form with specialized type-specific forms while preserving the unified creation pipeline.

## Supported Types

- YouTube
- Website
- PDF
- Book
- PowerPoint
- Word/Text Document
- Markdown
- Image
- Script
- Skill
- ZIP/Archive
- Other

## Shared Pipeline

The modal only collects input. Creation runs through the shared pipeline:

1. `AddResourceModal` collects validated user input in centralized typed state.
2. Type-specific renderers show only the fields relevant to the selected resource type.
3. `AddResourceService` canonicalizes tags, carries optional metadata, and checks duplicates.
4. `ResourceService` selects a provider through `ProviderRegistry`.
5. The selected provider creates and normalizes the `KnowledgeResource`.
6. `VaultResourceRepository` persists the Markdown resource note.
7. Open Knowledge Library views refresh and the resource note opens.

## YouTube

The YouTube form shows Type, YouTube URL, Tags, and Notes. Title and Creator are filled by provider metadata when available and are hidden by default. The `Edit metadata manually` disclosure reveals manual Title and Creator fields when needed.

YouTube links accept `youtube.com`, `youtu.be`, `shorts`, `embed`, `live`, and mobile links. Duplicates are prevented by YouTube video id.

## Websites

The Website form shows Type, Website URL, Tags, and Notes. Manual Title and Creator/Publisher fields are available in the metadata disclosure. The provider attempts page title extraction before saving and falls back to hostname when needed.

Duplicates are prevented by canonical URL.

## File-Based Resources

PDF, PowerPoint, Word/Text Document, Markdown, Image, Script, Skill, ZIP/Archive, and file-backed Other resources use the searchable vault file picker as the primary control. The original file is preserved; only a Markdown resource note is created.

Each file-based form exposes only relevant metadata fields. Images show a local preview when Obsidian can provide a vault resource URL. Scripts show selected filename and extension and prefill language from extension when available.

## Books

Books can use a local vault PDF/EPUB file or an external URL. The form requires at least one source and captures title, author, publisher, edition, and ISBN. No external book metadata API is used yet.

## Type Switching

Changing type preserves common Tags and Notes, clears incompatible URL or file fields safely, and can recompute the detected file type when a selected file remains relevant.

## Collections and Progress

All specialized forms include Collections, Priority, and Progress controls. Collections accept comma-separated values, use autocomplete suggestions from existing resource notes, and are canonicalized before saving. PDF and Book resources use page progress, PowerPoint uses slide progress, and YouTube/generic resources use percentage progress.
## Tags

Tags are canonicalized before saving. The default tag from settings is included, whitespace is trimmed, spaces become hyphens, `ia` merges into `ai`, and duplicates are removed.
