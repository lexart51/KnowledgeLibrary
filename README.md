# KnowledgeLibrary v6

KnowledgeLibrary is a professional Obsidian plugin for unified personal knowledge management across videos, PDFs, books, websites, documents, and AI-powered resources.

## Status

`6.0.0-alpha`

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

Type-check:

```bash
npx tsc --noEmit
```

The production build emits:

- `main.js`
- `styles.css`

## Current Plugin Surface

- Ribbon icon: opens the Knowledge Library view.
- Command palette command: `Knowledge Library: Open Library`.
- Command palette command: `Knowledge Library: Add Resource`.
- Status bar: `KL 6.0.0-alpha`.
- Native library view with search, filters, sorting, card grid, note/resource actions, and favorite/completed toggles.
- Read-only migration analysis and simulation commands for existing vault compatibility.
- Unified Add Resource wizard for YouTube, websites, books, and file-backed resources.
- Settings-driven storage paths:
  - Library folder: `01 - Biblioteca`
  - Resources folder: `01 - Biblioteca/Recursos`
- Markdown resource notes with YAML frontmatter.
- Canonical tag aliases:
  - `ia` -> `ai`
  - `artificial-intelligence` -> `ai`
  - `artificial intelligence` -> `ai`
  - `routeros` -> `mikrotik`
  - `win11` -> `windows`
  - `windows11` -> `windows`

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Resource Model](docs/RESOURCE_MODEL.md)
- [Providers](docs/PROVIDERS.md)
- [Storage](docs/STORAGE.md)
- [Library View](docs/LIBRARY_VIEW.md)
- [Migration](docs/MIGRATION.md)
- [Add Resource](docs/ADD_RESOURCE.md)
