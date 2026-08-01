# Unified Index

The unified knowledge index combines active-vault resources and read-only external references into one logical index.

Index entries include connector identity, vault name, role, type, title, creator, path, URL/open URI, tags, collections, excerpt, dates, status, favorite/progress when available, source platform, and metadata.

## Rebuild and Refresh

Use:

- `Knowledge Library: Refresh unified index`
- `Knowledge Library: Rebuild unified index`

The current implementation can fully rebuild the index and records connector status, item counts, last scan time, and errors. It tolerates connector failures and keeps indexing available connectors.

## Storage Location

The index is stored only in active-vault plugin data/config storage. It is not written into external vault folders.
