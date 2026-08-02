# KnowledgeLibrary v6

> **Recommended production version:** `6.4.1 LTS`
>
> **Experimental line:** `6.5 alpha` is retained in Git history and documentation, but it is **not production ready** and must not be deployed to the daily-use vault.

KnowledgeLibrary is a professional Obsidian plugin for unified personal knowledge management across videos, PDFs, books, websites, documents, and AI-powered resources.

## Verified Production State

- Production plugin version: `6.4.1 LTS`
- Stable release commit: `890ea68 Fix release version synchronization for 6.4.1`
- Production vault: `D:\Dropbox\Cursos Livros Instrucoes\YouTubes`
- Plugin source repository: `D:\Dropbox\KnowledgeLibrary`
- Conversation vault connector: `D:\Dropbox\Obsidian_Vault`
- Document vault connector: `D:\Dropbox\_Docs`
- Enabled read-only connectors: YouTubes/resources, Obsidian_Vault/conversations, `_Docs`/documents

The vaults remain physically independent. KnowledgeLibrary joins them logically through a unified metadata index stored in the active production plugin installation; connector scans do not move, rename, delete, or rewrite external vault files.

## Path Roles

`D:\Dropbox\KnowledgeLibrary`

Source code, tests, documentation, build scripts, and Git repository. Do not use this folder as an Obsidian vault data store.

`D:\Dropbox\Cursos Livros Instrucoes\YouTubes`

Active production Obsidian vault. This is the daily-use KnowledgeLibrary 6.4.1 LTS installation target.

`D:\Dropbox\Obsidian_Vault`

Read-only conversation archive connector for ChatGPT, Claude, Gemini, and related Markdown conversation notes.

`D:\Dropbox\_Docs`

Read-only document archive connector for document metadata and represented files.

## Stable 6.4.1 Functionality

The following functionality is considered safe for daily production use in 6.4.1:

- Native resource Library view for active-vault KnowledgeLibrary resources.
- Add Resource workflows through the shared AddResourceService pipeline.
- Local vault file resources for PDFs, Office documents, EPUBs, Markdown, images, scripts, archives, and generic files.
- Collections, progress tracking, priority, relationships, resource editing, and dashboard statistics.
- Read-only multi-vault connectors for resources, conversations, and documents.
- Rebuildable unified metadata index stored only in active-vault plugin data.
- Universal Knowledge Search with source-aware ranking, query filters, duplicate suppression, grouped display modes, and saved searches.
- Diagnostics view, self diagnostics, plugin configuration export/import, state backup/restore, and state corruption fallback.
- Artifact-only deployment that updates only `main.js`, `manifest.json`, and `styles.css` and preserves plugin state files such as `data.json`.

## Experimental 6.5 History

The 6.5 alpha line explored a new UX direction:

- `6.5.0-alpha.1`: Knowledge Navigator Home.
- `6.5.0-alpha.2`: Home duplicate-resource and Continue Learning hotfix.
- `6.5.0-alpha.3`: Topic Pages.
- `6.5.0-alpha.4`: Topic Page launch hotfix.
- `6.5.0-alpha.5`: Topic Browser and navigation diagnostics.
- `6.5.0-alpha.6`: persistent navigation shell.

The alpha.6 installed runtime locked the interface after navigation between major views. The production installation was intentionally rolled back to 6.4.1 LTS. These commits are retained for design history and technical reference, but 6.5 alpha artifacts are not stable, recommended, complete, or approved for production deployment.

## Development Commands

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Build the plugin:

```bash
npm run build
```

Production build:

```bash
npm run build:prod
```

Type-check:

```bash
npx tsc --noEmit
```

The production build emits:

- `main.js`
- `manifest.json`
- `styles.css`

Do not deploy experimental builds to the production vault unless they have passed real Obsidian acceptance testing and the release has been explicitly promoted from alpha/beta/RC to stable.

## Documentation

Start here:

- [Project Status](docs/PROJECT_STATUS.md)
- [Release Policy](docs/RELEASE_POLICY.md)
- [Lessons Learned](docs/LESSONS_LEARNED.md)
- [UX Redesign Plan](docs/UX_REDESIGN_PLAN.md)

Stable 6.4.1 architecture and operation:

- [Architecture](docs/ARCHITECTURE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Safe Deployment](docs/DEPLOYMENT_SAFE.md)
- [Plugin State](docs/PLUGIN_STATE.md)
- [Diagnostics](docs/DIAGNOSTICS.md)
- [Backup and Restore](docs/BACKUP_RESTORE.md)
- [Multi-Vault](docs/MULTI_VAULT.md)
- [Connectors](docs/CONNECTORS.md)
- [Unified Index](docs/UNIFIED_INDEX.md)
- [Unified Search](docs/UNIFIED_SEARCH.md)
- [Universal Search](docs/UNIVERSAL_SEARCH.md)
- [Privacy](docs/PRIVACY.md)
- [Resource Model](docs/RESOURCE_MODEL.md)
- [Providers](docs/PROVIDERS.md)
- [Storage](docs/STORAGE.md)
- [Library View](docs/LIBRARY_VIEW.md)
- [Add Resource](docs/ADD_RESOURCE.md)
- [Specialized Forms](docs/SPECIALIZED_FORMS.md)
- [Collections](docs/COLLECTIONS.md)
- [Progress](docs/PROGRESS.md)
- [Relationships](docs/RELATIONSHIPS.md)
- [Dashboard](docs/DASHBOARD.md)
- [Migration](docs/MIGRATION.md)
- [Migration Apply](docs/MIGRATION_APPLY.md)
- [Tag Manager](docs/TAG_MANAGER.md)
- [Thumbnail Repair](docs/THUMBNAIL_REPAIR.md)
- [File Resources](docs/FILE_RESOURCES.md)
- [File Picker](docs/FILE_PICKER.md)
- [Drag And Drop](docs/DRAG_AND_DROP.md)
- [UI/UX](docs/UI_UX.md)

Experimental 6.5 design-history documents:

- [Home](docs/HOME.md)
- [Topics](docs/TOPICS.md)
- [Topic Discovery](docs/TOPIC_DISCOVERY.md)
- [Related Topics](docs/RELATED_TOPICS.md)
- [Navigation](docs/NAVIGATION.md)
- [Navigation Shell](docs/NAVIGATION_SHELL.md)
- [User Workflow](docs/USER_WORKFLOW.md)
