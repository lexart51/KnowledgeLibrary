# Roadmap

## 1. Current Production

- [x] `6.4.2 LTS` is the recommended production version (6.4.1 plus Library/Dashboard cross-links, Continue Learning, and a Universal Search ribbon icon — see `docs/LESSONS_LEARNED.md`).
- [x] Stable baseline commit: `890ea68 Fix release version synchronization for 6.4.1` (original 6.4.1, preserved via tag `v6.4.1-stable`).
- [x] Production vault: `D:\Dropbox\Cursos Livros Instrucoes\YouTubes`.
- [x] Enabled read-only connectors: YouTubes/resources, Obsidian_Vault/conversations, `_Docs`/documents.
- [x] Accepted for daily use: artifact-only deployment, PluginStateManager, diagnostics, backup/restore, read-only connectors, unified index, Universal Search, Library, Add Resource, collections, progress, relationships, and dashboard statistics.
- [ ] Continue validating connector/search workflows on the 6.4.2 production installation before further UX work.

## 2. Frozen Experimental Work

- [x] `6.5.0-alpha.1`: Knowledge Navigator Home.
- [x] `6.5.0-alpha.2`: Home duplicate-resource and Continue Learning hotfix.
- [x] `6.5.0-alpha.3`: Topic Pages.
- [x] `6.5.0-alpha.4`: Topic Page launch hotfix.
- [x] `6.5.0-alpha.5`: Topic Browser and navigation diagnostics.
- [x] `6.5.0-alpha.6`: persistent navigation shell.
- [ ] Do not deploy 6.5 alpha artifacts to the production vault.
- [ ] Resolve unresolved blockers before resuming implementation: Topic Page launch reliability, modal-only navigation weakness, alpha.6 interface lock after major-view navigation, and the nav bar button clipping/label-visibility defect found on the Dashboard view (see `docs/LESSONS_LEARNED.md`, "Alpha.6 Isolated Diagnostic").

## 3. Next Planning Phase

- [x] Preserve and tag the 6.4.1 stable baseline (`v6.4.1-stable` -> `890ea68`; `v6.5.0-alpha.6-experimental` -> `8d5fd36`).
- [ ] Create a separate experimental branch for any future UX redesign implementation.
- [x] Phase 1 — Real workflow inventory documented against actual 6.4.1 entry points and click paths (see `docs/WORKFLOW_INVENTORY.md`).
- [x] Phase 2 — Information architecture decided: minimum top-level destinations are Library, Dashboard, and Universal Search (all already exist, now cross-linked). Home, Conversations, Documents, Collections, and Topics are explicitly not promoted to top-level — see `docs/INFORMATION_ARCHITECTURE.md` for the evidence and reasoning behind each.
- [x] Open ribbon-icon question resolved: Universal Search now has its own ribbon icon alongside Library, shipped as part of `6.4.2`.
- [ ] Prepare low-fidelity screen designs for Home, Search, Library, Topics, Documents, and Conversations. Per the Phase 2 decision, this is not currently needed — no new destinations were added.
- [ ] Prototype navigation that never depends on Ctrl+P and never blocks the interface with an overlay-only path.
- [ ] Define acceptance tests for each view independently.
- [ ] Validate prototypes in real Obsidian before implementation.
- [ ] Keep 6.4.2 untouched during any future UX redesign work.

## 4. Explicitly Out Of 6.5 Scope

The architecture already supports these evolutions, but they are deferred until navigation is refined and stable. None of the following belong in the 6.5 redesign:

- AI features of any kind.
- OCR.
- Embeddings.
- RAG.
- Automatic summaries.
- Internal chat.
- PDF and Office text extraction.
- Semantic search.

## 5. Version 7.0 Vision

The 7.0 leap is a single natural-language query resolved across every source: "Show me everything I know about WireGuard" returning a combined answer built from videos, PDFs, conversations, scripts, notes, and documents, each with a link back to open it.

6.5's navigation and search work already delivers most of the retrieval half of this for free, without AI: Universal Search in 6.4.1 already finds and links matching items across active-vault resources and connected conversations/documents, and a refined 6.5 search/browse experience extends that further. 7.0's actual job is narrower than "combine everything" — it is natural-language query understanding and synthesized answers over results retrieval already provides, which is the part that genuinely requires embeddings/RAG.
