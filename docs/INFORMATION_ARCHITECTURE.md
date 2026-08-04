# Information Architecture (Phase 2)

This is the Phase 2 deliverable defined in `CLAUDE_PROJECT_BRIEF.md` section 13: define the minimum top-level destinations, before any Phase 3 wireframe or Phase 4/5 implementation work. No code changes are part of this phase. This decision is built directly on `docs/WORKFLOW_INVENTORY.md` (Phase 1) and the fixes already shipped since it was written, not on the original 6.5 candidate list in isolation.

## Starting point: the brief's candidate set

`CLAUDE_PROJECT_BRIEF.md` section 13 proposed: Home, Search, Library, Conversations, Documents, Collections, Settings — with an explicit caution that Topics "should not automatically become top-level until validated by real usage." That caution is the operating principle for this whole document, applied to every candidate, not just Topics.

## What Phase 1 actually found

- Library and Dashboard were the only two views with real, working functionality and daily-use evidence. Universal Search existed but had no direct link from Library at all.
- The friction Phase 1 documented was almost entirely about **connections between existing views**, not missing views: Library ↔ Dashboard ↔ Search had no cross-links; admin actions (collections, connectors, diagnostics) had zero in-view entry points; there was no "continue studying" surface.
- Three of those four gaps are now fixed (`LESSONS_LEARNED.md`, "Cross-Link Gaps Fixed" and "Continue Learning Added"): Library, Dashboard, and Universal Search are now cross-linked to each other; collections/connectors/diagnostics have in-view buttons; Dashboard has a Continue Learning section.
- The remaining gap — Conversations/Documents as Library role filters rather than dedicated views — was a friction about disconnected surfaces (Library's role tab vs. Universal Search's `role:` filter), which is now also reduced by the same cross-link fix, since Library can reach Universal Search directly.

## Decision: minimum top-level destinations

**Library, Dashboard, Universal Search.** All three already exist, already work, and are now mutually cross-linked. Nothing else is added.

Everything else in the brief's candidate set is deliberately **not** promoted to top-level, each for a specific evidence-based reason:

- **Home** — not added. The 6.5 alpha's Home caused real, documented problems (duplicate-resource bugs, noisy Continue Learning) and was explicitly not revived this round. Continue Learning, the one concrete thing Home offered that Phase 1 confirmed was missing, now lives on Dashboard instead. No remaining evidence of a gap that only a dedicated Home screen would solve.
- **Conversations / Documents** — stay as Library role filters. The documented friction was about *reaching* Universal Search's cross-vault view from Library, not about the role tabs themselves being inadequate. That friction is now addressed by the Library → Universal Search button. Per the brief's own rule for Topics, applied here too: promote to a dedicated view only if real daily use shows the role-tab-plus-cross-link combination still isn't enough — not preemptively.
- **Collections** — stays as a Library filter + the "Manage collections" modal (already cross-linked from Library). No evidence of a need for a dedicated browsing screen beyond the existing filter.
- **Topics** — not reconsidered. The brief's own caution stands unchanged; nothing in this round of work re-opened that question.
- **Settings** — out of scope for this document. It's Obsidian's own standard plugin settings tab, not a destination this plugin invents navigation for.

## One open implementation question, not yet decided

Universal Search is now structurally on equal footing with Library and Dashboard (all three cross-link to each other), but only Library has a ribbon icon — Search and Dashboard are still one click deeper than Library from a cold start (no view open yet). Phase 1 flagged Universal Search specifically as "the single most cross-vault-capable feature in the plugin." Whether that gap is worth a second ribbon icon, versus leaving Library as the sole fixed entry point with Search one click away, is a real decision — small, low-risk, but a decision, not something to just implement under Phase 2. Flagged here for Phase 3/discussion rather than acted on.

## What this phase does not do

No wireframes, no click paths, no empty/loading/error states — that is Phase 3, and only for anything that changes as a result of this document (which, given the decision above, is nothing beyond the one open question noted). Phase 3 is not needed at all if the destination set stays at three existing, already-built views.
