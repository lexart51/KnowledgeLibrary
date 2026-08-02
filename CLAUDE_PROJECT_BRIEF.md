# CLAUDE_PROJECT_BRIEF.md

## KnowledgeLibrary — Project Constitution, Architecture Brief, and Future Plan

**Recommended production version:** `6.4.1 LTS`  
**Experimental line:** `6.5.0-alpha.*` — design history only; not approved for production.  
**Repository:** `lexart51/KnowledgeLibrary`

## 1. Paths and responsibilities

| Path | Role |
|---|---|
| `D:\Dropbox\KnowledgeLibrary` | Plugin source, tests, documentation, build scripts and Git repository. It is not a vault. |
| `D:\Dropbox\Cursos Livros Instrucoes\YouTubes` | Active production Obsidian vault and installed KnowledgeLibrary instance. |
| `D:\Dropbox\Obsidian_Vault` | Read-only archive of ChatGPT, Claude and Gemini conversations, plus MOCs. |
| `D:\Dropbox\_Docs` | Read-only document-oriented vault. |

Installed plugin path:

```text
D:\Dropbox\Cursos Livros Instrucoes\YouTubes\.obsidian\plugins\knowledge-library-v6
```

Plugin state normally lives in:

```text
D:\Dropbox\Cursos Livros Instrucoes\YouTubes\.obsidian\plugins\knowledge-library-v6\data.json
```

## 2. Mission

KnowledgeLibrary began as a replacement for **Video Knowledge Manager**, but evolved into a multi-vault personal knowledge system for:

- YouTube videos and websites;
- PDFs, books, PowerPoint, Word, text and Markdown;
- images, scripts, skills and archives;
- collections, progress, priority and relationships;
- ChatGPT, Claude and Gemini conversation archives;
- document repositories;
- unified metadata search across independent vaults.

The system should help the user find knowledge without remembering which vault contains it.

## 3. Core principles

1. **Index, do not duplicate.** External vault contents stay where they are.
2. **External vaults are read-only.** Never silently edit, move, rename or delete their files.
3. **Writes in the active vault must be explicit, scoped and reversible where practical.**
4. **Preserve unknown metadata and Markdown bodies.**
5. **UX is a layer above the stable architecture.** A UI redesign must not casually rewrite connectors, persistence, migration or indexing.
6. **Production and experimentation must be isolated.**
7. **No release is stable before real Obsidian runtime testing.** Passing tests and builds is not enough.
8. **No silent failures.** Every important action must succeed visibly or show an actionable error.

## 4. Stable architecture

```text
KnowledgeLibrary source repository
D:\Dropbox\KnowledgeLibrary
        |
        | build/deploy artifacts
        v
Active production vault
D:\Dropbox\Cursos Livros Instrucoes\YouTubes
        |
        +-- Active-vault resource notes
        +-- Plugin state
        +-- Unified metadata index
                |
                +-- YouTubes connector      [resources]
                +-- Obsidian_Vault connector [conversations]
                +-- _Docs connector          [documents]
```

The unified index stores discovery metadata and references, not full external content. Typical indexed fields include title, source, vault, role, type, tags, collections, headings, excerpt, dates, relative path and open URI.

The active vault and the `YouTubes` connector can describe overlapping content, so duplicate suppression is required.

## 5. Stable feature set — 6.4.1 LTS

### Resource types

- YouTube
- Website
- PDF
- Book
- PowerPoint
- Word/Text document
- Markdown
- Image
- Script
- Skill
- Archive
- Other local or external resource

### Resource organization

- Tags
- Collections
- Favorite
- Priority
- Progress and current position
- Completed status
- Typed related-resource relationships

### Multi-vault capabilities

Configured connectors:

```text
YouTubes       role: resources      D:\Dropbox\Cursos Livros Instrucoes\YouTubes
Obsidian_Vault role: conversations  D:\Dropbox\Obsidian_Vault
_Docs          role: documents      D:\Dropbox\_Docs
```

### Universal Search

Stable search capabilities include:

- source, vault, role and type filters;
- tags, collections and platform filters;
- priority and progress filters;
- deterministic ranking;
- active-vault, favorite and recent-item boosts;
- duplicate suppression;
- saved searches;
- keyboard navigation.

Examples:

```text
wireguard source:Obsidian_Vault
mikrotik type:pdf
hermes platform:chatgpt
retirement collection:"Retirement Automation"
tag:security favorite:true
```

### Reliability introduced in 6.4.1

- artifact-only deployment;
- state-preserving updates;
- `PluginStateManager`;
- state schema versioning and migration;
- unknown-field preservation;
- backup and restore;
- configuration export and import;
- diagnostics and self-test;
- configurable logging;
- release-version synchronization.

## 6. Deployment and state safety

Early deployment replaced the entire plugin folder and erased `data.json`. This removed connector configuration and made only `Active Vault` appear.

The corrected deployment must update only:

```text
main.js
manifest.json
styles.css
```

All state and future cache/index files must remain untouched.

Windows deployment:

```powershell
cd "D:\Dropbox\KnowledgeLibrary"
powershell -ExecutionPolicy Bypass -File ".\scripts\deploy-windows.ps1"
```

Backups should be kept outside `.obsidian\plugins`, normally under:

```text
D:\Dropbox\Cursos Livros Instrucoes\YouTubes_BACKUPS
```

### Post-deploy checklist

- Obsidian plugin manager version matches the intended release.
- Status bar version matches the same release.
- `data.json` still exists.
- The three connectors remain configured.
- Library, Dashboard and Universal Search open.
- Filters and scrolling work.
- No duplicate plugin folder is present.

## 7. Version integrity

All of these must agree:

- `package.json`
- `package-lock.json`
- `manifest.json`
- source version constant
- compiled `main.js`
- status bar label
- deployment report
- Obsidian plugin manager
- runtime status bar

A historical stale `versionLabel` in persisted state caused mismatched versions. The fix ensures the current compiled default cannot be overridden by an old saved label.

Required verification:

```bash
npm test
npm run build
npm run build:prod
npx tsc --noEmit
git diff --check
```

## 8. Version history

### 6.0

Core architecture, providers, storage, migration compatibility, Add Resource, local file support and initial native Library.

### 6.1

Specialized Add Resource forms.

### 6.2

Collections, progress, priority, relationships and dashboard.

### 6.3

Read-only multi-vault connectors, unified index and external references.

### 6.4

Universal Search, source-aware ranking, query syntax, saved searches and duplicate suppression.

### 6.4.1

Safe deployment, robust plugin state, diagnostics, backup/restore, logger and synchronized release versions. This is the production LTS baseline.

## 9. Experimental 6.5 line

The 6.5 series tried to redesign the user experience so normal use would not depend on `Ctrl+P`.

### alpha.1 — Home

Added search-first Home, Continue Learning, Recent Activity, recent Resources/Conversations/Documents, favorite Collections and most-used Tags.

### alpha.2 — Home hotfix

Fixed duplicate active-vault/connector entries, Continue Learning eligibility, date fallback and logical counts.

### alpha.3 — Topic Pages

Added automatic topic discovery, Topic ItemView, related topics, topic timeline and topic-scoped Continue Learning.

### alpha.4 — Topic launch hotfix

Replaced a browser prompt with a searchable topic-picker modal and added validation.

### alpha.5 — Topic Browser and diagnostics

Added a persistent Topics ItemView, topic runtime diagnostics and initial shared navigation shell.

### alpha.6 — Navigation workflow redesign

Added persistent navigation, Home as entry point, Topics browser and workflow-first Dashboard.

### Blocking runtime result

After deployment, clicking navigation items caused the Obsidian interface to stop responding to further clicks. The implementation passed tests, builds and type checks, but failed in the real application.

The production installation was rolled back to 6.4.1. No source vault data was lost.

The 6.5 alpha line is retained for design and engineering lessons only.

## 10. Lessons learned

- A visually attractive Home is not automatically a useful workflow.
- More screens do not automatically improve navigation.
- `Ctrl+P` is a secondary power-user interface, not primary navigation.
- A modal is not a reliable persistent navigation surface.
- UI overlays, `pointer-events`, focus traps, z-index and modal lifecycle can block Obsidian even when code does not crash.
- Unit tests cannot replace real Obsidian acceptance testing.
- Experimental UX work must live on a separate branch and preferably use a separate test vault or plugin ID.
- Stable rollback points are essential.
- Failed experiments should be documented honestly, not erased.
- Navigation should be integrated only after each destination view works independently.

## 11. Git and release references

Stable 6.4.1 commit:

```text
890ea68
```

Recommended stable tag:

```text
v6.4.1-stable
```

Final alpha.6 experimental commit:

```text
8d5fd36
```

Suggested archival tag:

```text
v6.5.0-alpha.6-experimental
```

Recommended branch model:

```text
main             stable production and approved documentation
ux-prototype     wireframes and low-risk prototypes
develop-ui       approved experimental implementation
feature/<name>   isolated feature work
```

Future experimental UX must not be developed directly against the daily-use production installation.

## 12. Future product vision

The long-term goal remains a personal knowledge navigator able to answer:

- What do I already know about this subject?
- Where did I discuss it before?
- Which materials should I continue?
- Which documents support this project?
- What changed recently?
- Which resources are related?

However, the next phase is **design-first**, not feature-first.

## 13. Future UX plan — no code first

### Phase 1 — Real workflow inventory

Document actual tasks:

- find a resource;
- add a link or local file;
- find a past conversation;
- locate a document;
- continue studying;
- open a collection;
- search all vaults;
- inspect connector health;
- return to a recent item.

### Phase 2 — Information architecture

Define the minimum top-level destinations. Candidate set:

- Home
- Search
- Library
- Conversations
- Documents
- Collections
- Settings

Topics should not automatically become top-level until validated by real usage.

### Phase 3 — Low-fidelity wireframes

Before code, define for every screen:

- purpose;
- primary action;
- secondary actions;
- data shown;
- empty state;
- loading state;
- error state;
- keyboard behavior;
- narrow-window behavior;
- entry and exit paths.

### Phase 4 — Isolated prototype

Use a separate branch, test vault and optionally a separate plugin ID.

### Phase 5 — One view at a time

Suggested order:

1. Search
2. Library
3. Conversations
4. Documents
5. Home
6. Collections
7. Topics, only if still justified

### Phase 6 — Navigation integration

Add common navigation only after all destinations work independently.

### Phase 7 — Runtime acceptance

Verify:

- no blocked clicks;
- no invisible overlay;
- no focus trap;
- no scroll lock;
- no duplicated navigation;
- no required dependence on `Ctrl+P`;
- view restoration works;
- connectors and state survive;
- rollback is tested.

## 14. Proposed future screens

### Search

Primary purpose: find anything in less than ten seconds.

Possible elements:

- large search field;
- recent and saved searches;
- grouped results;
- source badges;
- simple filters;
- keyboard navigation.

### Library

Primary purpose: browse and manage active-vault resources.

### Conversations

Primary purpose: find earlier discussions across ChatGPT, Claude and Gemini, showing platform, headings, excerpt, date and original-note action.

### Documents

Primary purpose: locate `_Docs` files and references, showing type, filename, folder, modified date and open action.

### Home

Primary purpose: simple start page, not a second Dashboard.

Possible content:

- Search;
- Continue Learning;
- recent resources;
- recent conversations;
- recent documents;
- connector-health warning.

### Dashboard

Primary purpose: explain system and connector/index health. It can remain more technical than Home.

### Topics

Keep as a future option. Reconsider only after Search and basic navigation are stable. Deterministic metadata-based discovery should be validated before any AI topic clustering.

## 15. Later technical roadmap

Only after UX and runtime stability:

1. PDF text extraction
2. Office metadata and previews
3. PowerPoint slide titles and notes
4. EPUB metadata
5. Optional OCR
6. Semantic search
7. Embeddings and related-item recommendations
8. Optional local or privacy-aware RAG assistant

Possible future questions:

- What have I studied about MikroTik Netwatch?
- Where did I discuss OpenRouter?
- Which documents relate to diabetes?
- Which AI videos are partially complete?
- What was the final SP router failover solution?

AI features must be optional, transparent, source-grounded, privacy-aware and disabled by default.

## 16. Rules for Claude or another AI developer

Before proposing code, answer:

1. What real user problem is being solved?
2. Can it be solved without new code?
3. Which stable components are affected?
4. Could it break connectors, index, state or deployment?
5. How will it be tested in actual Obsidian?
6. What is the rollback plan?

Before changing architecture, provide:

- current architecture;
- proposed architecture;
- compatibility impact;
- data/state migration;
- external-vault impact;
- rollback procedure.

Before changing UX, provide:

- workflow;
- wireframe;
- click path;
- keyboard path;
- empty, loading and error states;
- runtime acceptance criteria.

Additional rules:

- no silent failures;
- no hidden bulk writes;
- preserve unknown metadata and Markdown body;
- avoid unnecessary dependencies;
- do not bundle several major features into one milestone;
- do not call a release stable before deployment and real testing;
- external connectors stay read-only unless the user explicitly approves an architectural change.

## 17. Production acceptance checklist

### Build

- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run build:prod`
- [ ] `npx tsc --noEmit`
- [ ] `git diff --check`

### Version

- [ ] package version correct
- [ ] package-lock version correct
- [ ] manifest version correct
- [ ] compiled version correct
- [ ] status label correct
- [ ] deployment report correct

### State

- [ ] `data.json` preserved
- [ ] connectors preserved
- [ ] saved searches preserved
- [ ] settings preserved
- [ ] index readable

### Runtime

- [ ] plugin loads
- [ ] Library opens
- [ ] Universal Search opens
- [ ] Dashboard opens
- [ ] Add Resource opens
- [ ] connectors available
- [ ] filters clickable
- [ ] scrolling works
- [ ] no blocked interface
- [ ] no invisible overlay
- [ ] no duplicate plugin folder

### Rollback

- [ ] stable backup exists
- [ ] rollback commit known
- [ ] rollback procedure tested

## 18. Rollback to 6.4.1

Close Obsidian and run:

```powershell
cd "D:\Dropbox\KnowledgeLibrary"
git switch --detach 890ea68
npm run build:prod
powershell -ExecutionPolicy Bypass -File ".\scripts\deploy-windows.ps1"
git switch main
```

Reopen Obsidian and confirm:

```text
KnowledgeLibrary v6.4.1
KL 6.4.1
```

Then verify the three connectors, Library and Universal Search.

## 19. First steps when Claude takes over

Claude should not immediately implement features.

First:

1. read this document completely;
2. inspect repository status, branches, tags and recent commits;
3. verify stable commit `890ea68` and experimental commit `8d5fd36`;
4. verify documentation matches 6.4.1 LTS;
5. confirm no uncommitted changes;
6. summarize the stable architecture;
7. summarize the 6.5 runtime failure;
8. propose a design-only UX recovery plan;
9. create no code until the plan is approved.

## 20. Suggested initial prompt for Claude

```text
You are taking over the KnowledgeLibrary project.

Read CLAUDE_PROJECT_BRIEF.md completely before proposing any change.
Treat KnowledgeLibrary 6.4.1 as the production LTS baseline.

Do not deploy or modify the production vault.
Do not continue the 6.5 alpha implementation directly.

First:
1. inspect repository status, branches, tags, documentation and recent commits;
2. verify stable commit 890ea68 and experimental commit 8d5fd36;
3. identify documentation inconsistencies;
4. summarize the stable architecture;
5. summarize the 6.5 failure;
6. propose a design-only UX recovery plan;
7. create no code until the plan is approved.

Future UX must be prototyped and tested in isolation before production deployment.
```

## 21. Final project status

### Production

```text
KnowledgeLibrary 6.4.1 LTS
```

- stable daily-use baseline;
- multi-vault connectors working;
- unified search working;
- state-preserving deployment working;
- rollback available.

### Experimental

```text
KnowledgeLibrary 6.5.0-alpha.*
```

- retained for design and engineering lessons;
- not production-ready;
- must not be deployed to the daily-use vault;
- future UX work must restart from design and isolated prototyping.

### Strategic direction

Preserve the stable knowledge engine. Redesign the user experience carefully. Add AI only after navigation, workflow quality and runtime stability are proven.
