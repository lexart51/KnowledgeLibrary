# Add Resource Wizard

Milestone 4 adds the first complete resource creation workflow through `Knowledge Library: Add Resource`.

## Supported Types

- YouTube
- Website
- PDF
- Book
- PowerPoint
- Markdown
- Image
- Script
- Skill
- ZIP/Archive
- Other

## Shared Pipeline

The modal only collects input. Creation runs through the shared pipeline:

1. `AddResourceModal` collects validated user input.
2. `AddResourceService` canonicalizes tags and checks duplicates.
3. `ResourceService` selects a provider through `ProviderRegistry`.
4. The selected provider creates and normalizes the `KnowledgeResource`.
5. `VaultResourceRepository` persists the Markdown resource note.
6. Open Knowledge Library views refresh and the resource note opens.

## YouTube

YouTube links accept `youtube.com`, `youtu.be`, `shorts`, `embed`, `live`, and mobile links. Tracking and playlist noise such as `pp`, `si`, `feature`, `t`, and list parameters are ignored because the provider extracts only the canonical 11-character video id and writes `https://www.youtube.com/watch?v=...`.

The provider uses Obsidian `requestUrl` to call YouTube oEmbed for title and creator. If oEmbed fails, the resource remains active and falls back to a deterministic title and thumbnail.

Duplicates are prevented by YouTube video id.

## Websites

Website links accept HTTP and HTTPS URLs. The provider removes common tracking parameters, fetches the page with Obsidian `requestUrl`, extracts the `<title>` when available, and falls back to the hostname.

Duplicates are prevented by canonical URL.

## Files

File-based resources select an existing vault file. The original file is preserved; only a Markdown resource note is created. Type detection uses file extension for PDFs, PowerPoint files, Markdown, images, scripts, archives, and generic files.

## Books

Books can be represented by a local vault file or external URL. The wizard captures title, creator/author, edition, publisher, and ISBN. No external book API is used yet.

## Tags

Tags are canonicalized before saving. The default tag from settings is included, whitespace is trimmed, spaces become hyphens, `ia` merges into `ai`, and duplicates are removed.
