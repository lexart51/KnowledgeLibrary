# TODO

## Production Baseline

- Preserve and tag the `6.4.1 LTS` stable baseline at commit `890ea68`.
- Validate connector/search workflows on the 6.4.1 production installation.
- Keep production vault deployment limited to approved 6.4.1 LTS artifacts until a future release passes real Obsidian acceptance testing.
- Keep plugin source, tests, docs, and Git history separate from vault data.

## UX Redesign Planning

- Design UX before coding.
- Create a separate experimental branch for the next UX redesign attempt.
- Prepare low-fidelity navigation prototypes for Home, Search, Library, Topics, Documents, and Conversations.
- Define acceptance tests for each view and navigation transition.
- Prototype a navigation model that never depends on Ctrl+P for normal workflows.
- Avoid blocking overlays as the only access path for core navigation.
- Avoid production deployment of 6.5 alpha artifacts.

## Stable Backlog

- Add richer provider metadata extraction after UX and stability work.
- Add settings UI for alias management.
- Add library view empty states and bulk actions.
- Continue improving resource editing workflow from the 6.4.1 baseline.

## Completed in 6.4.1

- Made deployment artifact-only and state-preserving.
- Added plugin state manager, storage repositories, diagnostics, logger, self-test, backup/restore, and configuration export/import.
- Added maintenance reliability documentation and regression tests.

## Completed Before 6.4.1

- Added Universal Knowledge Search, deterministic ranking, query filters, duplicate suppression, saved searches, and result highlighting in 6.4.0.
- Added read-only multi-vault connectors, unified metadata index, source/vault/role filtering, and connector dashboard status in 6.3.0.
- Added collections, progress tracking, priority, relationships, dashboard, and selected-resource editing in 6.2.0.
- Added specialized type-specific Add Resource forms in 6.1.0.
- Added local vault file resource support, UI polish, migration safety, tag consolidation, and YouTube thumbnail repair across the 6.0 beta/RC line.

## Frozen 6.5 Experimental Line

- `6.5.0-alpha.1` through `6.5.0-alpha.6` are retained for design history only.
- Do not deploy 6.5 alpha artifacts to the production vault.
- Future UX work must restart from prototypes and branch isolation, not direct production implementation.
