# Workflow Inventory (Phase 1 — Real Workflow Inventory)

This is the Phase 1 deliverable defined in `CLAUDE_PROJECT_BRIEF.md` section 13: document actual tasks as they work today in `6.4.1 LTS`, before any Phase 2 information-architecture or Phase 3 wireframe work begins. No code changes are part of this phase. Every entry point below was verified against the current `6.4.1` source (`src/commands/libraryCommands.ts`, `src/ui/RibbonService.ts`, `src/ui/KnowledgeLibraryView.ts`, `src/ui/KnowledgeDashboardView.ts`), not assumed.

## Today's real entry points, in full

- **Ribbon icon:** exactly one — "Open Knowledge Library" (`RibbonService.ts`). This is the only non-command-palette entry point into the plugin.
- **Command palette (`Ctrl+P`):** 26 registered commands, covering everything else — Add Resource, Dashboard, Universal Search, saved searches, collections manager, vault connectors manager, diagnostics, backup/restore, config export/import, index refresh/rebuild, migration tools, tag consolidation, thumbnail repair.
- **In-Library-view buttons:** header `Add` and `Refresh`; toolbar search field; filters for Type, Tag, Collection, Priority, Progress, Status, Sort; toggles for Favorites, Completed, Missing files; role tabs All/Resources/Conversations/Documents; per-card actions Open note, Open resource, Favorite/Unfavorite, Complete/Mark incomplete, Progress.
- **In-Dashboard-view buttons:** `Universal Search`, `Refresh connectors`, `Rebuild all` (index).

This confirms the brief's own diagnosis in section 10 ("`Ctrl+P` is a secondary power-user interface, not primary navigation") with actual numbers: of 26 real actions, only 1 (opening the Library itself) has a non-palette entry point in the shipped 6.4.1 UI. Dashboard is reachable only via `Ctrl+P` unless the user already has it open from a previous session (persistent leaf).

## Task-by-task inventory

For each task from the brief's Phase 1 list: current entry point(s), click path, and observed friction.

### Find a resource

- **Entry point:** Ribbon → Library, then the search field, or Type/Tag/Collection/Priority/Progress/Status filters and role tabs.
- **Click path:** 1 click (ribbon) to open Library, then type in search or select filters. No modal, no command needed once Library is open.
- **Friction:** none of the filter state is shareable/savable — closing and reopening Library resets filters to default (`role: "all"`, etc.). No saved "views," only Universal Search has saved searches.

### Add a link or local file

- **Entry point:** `Add` button inside Library (if Library is already open), or `Ctrl+P → Knowledge Library: Add Resource` command otherwise.
- **Click path:** 1 click if Library is open; 2+ keystrokes/clicks (palette) otherwise.
- **Friction:** none observed — this is one of the few tasks with a direct in-view button. Specialized forms per resource type exist (per `docs/SPECIALIZED_FORMS.md`) but were not re-verified here.

### Find a past conversation

- **Entry point:** Library role tab "Conversations" (active-vault + connector-indexed conversations only, filtered/searched like any other role), or `Ctrl+P → Search all connected vaults` / `Open universal search` for cross-vault query syntax (e.g. `platform:chatgpt`).
- **Click path:** 1 click (ribbon) + 1 click (role tab) for browsing; palette + typed query for targeted search.
- **Friction:** two different surfaces do overlapping jobs (Library's Conversations tab vs. Universal Search's `role:conversations`/`platform:` filters) with no in-view link between them — a user in Library cannot jump to a saved search or vice versa without the palette.

### Locate a document

- Same shape as "find a past conversation," substituting the "Documents" role tab and `_Docs` connector metadata (type, filename, folder, modified date per the brief's proposed-screens section). No dedicated Documents surface exists yet in 6.4.1; it is a Library role filter only.

### Continue studying

- **Entry point:** Library filtered by Progress = "in progress," or the per-card `Progress` quick-edit action once a resource is found.
- **Click path:** ribbon → Library → set Progress filter → find item → open.
- **Friction:** no dedicated "continue where I left off" surface in 6.4.1 (this was the 6.5 alpha Home's "Continue Learning" idea, not yet validated against real usage per the brief's own caution in section 14).

### Open a collection

- **Entry point:** Library's Collection filter dropdown (browsing), or `Ctrl+P → Manage collections` (administration: create/rename/delete).
- **Click path:** 1 click (ribbon) + 1 select (dropdown) to browse a collection; palette command only to manage collections.
- **Friction:** browsing a collection and managing collections are two disconnected surfaces; no in-view "manage collections" link from the Collection filter itself.

### Search all vaults

- **Entry point:** Dashboard's `Universal Search` button (if Dashboard is already open), or `Ctrl+P → Open universal search` / `Search all connected vaults`.
- **Click path:** 1 click if Dashboard is open; palette otherwise. Library itself has no direct link into Universal Search.
- **Friction:** this is the single most cross-vault-capable feature in the plugin (query syntax, saved searches, deterministic ranking, duplicate suppression per `CLAUDE_PROJECT_BRIEF.md` section 5) but it is not reachable from Library at all, only from Dashboard or the palette.

### Inspect connector health

- **Entry point:** Dashboard's `Refresh connectors` / `Rebuild all` buttons (implies Dashboard shows connector status inline), or `Ctrl+P → Test vault connectors` / `Open diagnostics`.
- **Click path:** 1 click if Dashboard already open; palette otherwise.
- **Friction:** none major — this is Dashboard's actual designed purpose per the brief's section 14 ("explain system and connector/index health"), and it already does that job in 6.4.1.

### Return to a recent item

- **Entry point:** none dedicated. Library's default Sort option "updated" surfaces recently-touched items, but there is no explicit "recent" list or history.
- **Friction:** this is a real gap. The 6.5 alpha Home's "Recent Activity" concept targeted exactly this, but per the brief it must be re-validated, not assumed necessary, before becoming a top-level destination.

## Summary of confirmed gaps (for Phase 2 input)

1. ~~Dashboard and Universal Search are each one click away from each other and from nothing else — Library has no link to either.~~ **Fixed** — see `LESSONS_LEARNED.md`, "Cross-Link Gaps Fixed." Library now links to Dashboard and Universal Search; Dashboard now links to Library.
2. ~~Administrative tasks (collections manager, vault connectors manager, diagnostics, backup/restore) have zero in-view entry points; 100% `Ctrl+P`-dependent.~~ **Partially fixed** — Manage collections (Library), Manage connectors and Diagnostics (Dashboard) now have in-view buttons. Backup/restore and config export/import remain `Ctrl+P`-only by choice, since those are more consequential, data-mutating actions not suited to a casual one-click button.
3. No cross-surface "recent items" or "continue studying" view exists today outside of Library's Progress filter and Sort-by-updated, both of which require already being in Library with the right filter set. **Still open** — this is a real new-screen decision, not an additive fix, and belongs to Phase 2/3.
4. Conversations and Documents are Library role filters, not dedicated views — matches the brief's own instruction (section 13, Phase 2) not to assume they need to be top-level until validated. **Still open**, by design — Phase 2 territory.

This inventory intentionally stops here for gaps 3 and 4. Per the brief, Phase 2 (information architecture) and Phase 3 (wireframes) come next for those, and are separate, later decisions — not implied by anything in this document.
