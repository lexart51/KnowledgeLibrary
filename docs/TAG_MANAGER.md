# Tag Manager

Milestone 5 adds tag analysis and alias consolidation.

## Commands

- `Knowledge Library: Analyze tags`
- `Knowledge Library: Consolidate tag aliases`

Analysis is read-only. Consolidation previews exact replacements and requires confirmation before writing.

## Canonical Aliases

At minimum, these aliases are consolidated:

- `ia` -> `ai`
- `artificial-intelligence` -> `ai`
- `artificial intelligence` -> `ai`
- `routeros` -> `mikrotik`
- `win11` -> `windows`
- `windows11` -> `windows`

The tag service removes duplicate canonical tags and preserves unrelated tags.
