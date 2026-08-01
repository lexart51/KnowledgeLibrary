# KnowledgeLibrary v6

KnowledgeLibrary is a professional Obsidian plugin for unified personal knowledge management across videos, PDFs, books, websites, documents, and AI-powered resources.

## Status

`6.0.0-rc.2`

## Development

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

## Deployment

KnowledgeLibrary v6 installs side by side under plugin id and folder `knowledge-library-v6`. Deployment scripts copy only the three production files and back up any existing v6 target before copying.

## Current Plugin Surface

- Ribbon icon: opens the Knowledge Library view.
- Command palette command: `Knowledge Library: Open Library`.
- Command palette command: `Knowledge Library: Add Resource`.
- Command palette command: `Knowledge Library: Analyze existing vault`.
- Command palette command: `Knowledge Library: Simulate migration`.
- Command palette command: `Knowledge Library: Create migration backup`.
- Command palette command: `Knowledge Library: Apply migration`.
- Command palette command: `Knowledge Library: Analyze tags`.
- Command palette command: `Knowledge Library: Consolidate tag aliases`.
- Command palette command: `Knowledge Library: Repair YouTube thumbnails`.
- Status bar: `KL 6.0.0-rc.2`.
- Polished native library view with responsive toolbar, search, filters, missing-file filtering, sorting, card grid, note/resource actions, and favorite/completed toggles.
- Read-only migration analysis and simulation commands for existing vault compatibility.
- Confirmed safe write workflows for migration backup, migration apply, tag consolidation, and YouTube thumbnail repair.
- Responsive Add Resource wizard for YouTube, websites, books, and searchable vault-file resources with automatic type detection.
- Settings-driven storage paths:
  - Library folder: `01 - Biblioteca`
  - Resources folder: `01 - Biblioteca/Recursos`
- Markdown resource notes with YAML frontmatter.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Resource Model](docs/RESOURCE_MODEL.md)
- [Providers](docs/PROVIDERS.md)
- [Storage](docs/STORAGE.md)
- [Library View](docs/LIBRARY_VIEW.md)
- [Migration](docs/MIGRATION.md)
- [Migration Apply](docs/MIGRATION_APPLY.md)
- [Tag Manager](docs/TAG_MANAGER.md)
- [Thumbnail Repair](docs/THUMBNAIL_REPAIR.md)
- [Add Resource](docs/ADD_RESOURCE.md)
- [File Resources](docs/FILE_RESOURCES.md)
- [File Picker](docs/FILE_PICKER.md)
- [Drag And Drop](docs/DRAG_AND_DROP.md)
- [UI/UX](docs/UI_UX.md)
- [Deployment](docs/DEPLOYMENT.md)
