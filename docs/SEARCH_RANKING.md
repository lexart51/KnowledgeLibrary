# Search Ranking

This describes Universal Search ranking available in the stable 6.4.1 production baseline.


Universal Search ranks cached unified-index entries with deterministic scores.

## Match Priority

Ranking considers:

- exact title match
- title starts with query
- title token match
- tag exact match
- collection exact match
- creator match
- heading match
- excerpt match
- path and file-name match
- connector, vault, platform, and type match

## Boosts

Settings control boosts for active-vault resources, favorites, and recent items. High-priority resources also receive a fixed boost.

## Penalties

Search penalizes unavailable connectors, unavailable resources, weak excerpt-only matches, and search-time duplicates. Duplicate suppression never deletes or modifies source data.
