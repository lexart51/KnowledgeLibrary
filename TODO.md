# TODO

- Deploy KnowledgeLibrary 6.1.0 into the YouTubes vault only after confirming the target path.
- Run migration analysis and review generated counts in Obsidian.
- Create migration backup before any apply operation.
- Add richer provider metadata extraction.
- Add settings UI for alias management.
- Add library view empty states and bulk actions.
- Add resource editing workflow.

## Completed in 6.0.0-beta.2

- Fixed library view scrolling for large card grids.
- Fixed YouTube thumbnail fallback rendering for new and legacy resources.
- Consolidated legacy `ia` tags into canonical `ai` across read, write, filter, analysis, and migration paths.

## Completed in 6.0.0-beta.3

- Completed local vault file resource support with picker, metadata, dedupe, missing-file display, and drag/drop prefill.
- Added file resource documentation.

## Completed in 6.0.0-rc.1

- Polished Add Resource modal layout, toolbar wrapping, card visual hierarchy, accessibility labels, and settings grouping.
- Added UI/UX documentation and regression tests.

## Completed in 6.0.0-rc.2

- Hotfixed Add Resource modal overflow, clipped right column, selector sizing, and responsive grid behavior.

## Completed in 6.1.0

- Replaced the generic Add Resource wizard with specialized type-specific forms.
- Preserved the shared AddResourceService persistence pipeline for every form.
- Added natural-height modal sizing and tests for specialized form behavior.
