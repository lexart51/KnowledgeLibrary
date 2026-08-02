# Unified Index

This document describes the stable `6.4.1 LTS` unified metadata index. It does not describe 6.5 UX experiments.


The unified knowledge index combines active-vault resources and read-only external references into one logical index.

Index entries include connector identity, vault name, role, type, title, creator, path, URL/open URI, tags, collections, excerpt, dates, status, favorite/progress when available, source platform, and metadata.

## Rebuild and Refresh

Use:

- `Knowledge Library: Refresh unified index`
- `Knowledge Library: Rebuild unified index`

The current implementation can fully rebuild the index and records connector status, item counts, last scan time, and errors. It tolerates connector failures and keeps indexing available connectors.

## Storage Location

The index is stored only in active-vault plugin data/config storage. It is not written into external vault folders.
## Search Use

Universal Search reads the rebuilt unified index from active-vault plugin data and keeps it in memory while searching. Queries do not rescan external vaults and do not cache full conversation or document content.
