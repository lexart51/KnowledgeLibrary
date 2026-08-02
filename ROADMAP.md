# Roadmap

## 1. Current Production

- [x] `6.4.1 LTS` is the recommended production version.
- [x] Stable baseline commit: `890ea68 Fix release version synchronization for 6.4.1`.
- [x] Production vault: `D:\Dropbox\Cursos Livros Instrucoes\YouTubes`.
- [x] Enabled read-only connectors: YouTubes/resources, Obsidian_Vault/conversations, `_Docs`/documents.
- [x] Accepted for daily use: artifact-only deployment, PluginStateManager, diagnostics, backup/restore, read-only connectors, unified index, Universal Search, Library, Add Resource, collections, progress, relationships, and dashboard statistics.
- [ ] Continue validating connector/search workflows on the 6.4.1 production installation before further UX work.

## 2. Frozen Experimental Work

- [x] `6.5.0-alpha.1`: Knowledge Navigator Home.
- [x] `6.5.0-alpha.2`: Home duplicate-resource and Continue Learning hotfix.
- [x] `6.5.0-alpha.3`: Topic Pages.
- [x] `6.5.0-alpha.4`: Topic Page launch hotfix.
- [x] `6.5.0-alpha.5`: Topic Browser and navigation diagnostics.
- [x] `6.5.0-alpha.6`: persistent navigation shell.
- [ ] Do not deploy 6.5 alpha artifacts to the production vault.
- [ ] Resolve unresolved blockers before resuming implementation: Topic Page launch reliability, modal-only navigation weakness, and alpha.6 interface lock after major-view navigation.

## 3. Next Planning Phase

- [ ] Preserve and tag the 6.4.1 stable baseline.
- [ ] Create a separate experimental branch for any future UX redesign implementation.
- [ ] Design user workflows before coding.
- [ ] Prepare low-fidelity screen designs for Home, Search, Library, Topics, Documents, and Conversations.
- [ ] Prototype navigation that never depends on Ctrl+P and never blocks the interface with an overlay-only path.
- [ ] Define acceptance tests for each view independently.
- [ ] Validate prototypes in real Obsidian before implementation.
- [ ] Keep 6.4.1 untouched during UX work.

## 4. Later Capabilities

Schedule these only after UX and stability work:

- PDF and Office text extraction.
- OCR.
- Semantic search.
- Embeddings.
- RAG.
- Local or optional AI integrations.
