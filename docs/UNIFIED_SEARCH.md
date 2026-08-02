# Unified Search

This document describes stable connected-vault search behavior available in the `6.4.1 LTS` production baseline.


`Knowledge Library: Search all connected vaults` opens a dedicated search modal over the unified index.

Search covers:

- active-vault resources
- resource-vault references
- conversation references
- document references

Fields searched include title, creator, tags, collections, excerpt, source platform, connector display name, vault name, and type.

Results show source badges, vault name, type, excerpt, and an open action. Search does not write to external vaults.
## 6.4.0 Universal Search

The earlier connected-vault search modal remains available, but `Universal Knowledge Search` is now the primary search surface. It uses the unified index, source-aware ranking, query filters, keyboard navigation, display modes, matched-term highlighting, and saved searches.

See `docs/UNIVERSAL_SEARCH.md`, `docs/SEARCH_RANKING.md`, `docs/QUERY_SYNTAX.md`, and `docs/SAVED_SEARCHES.md`.


## Experimental Navigation Note

6.5 Topic Page navigation and navigation-shell behavior are experimental history. Stable 6.4.1 search should be used without deploying 6.5 alpha artifacts.
