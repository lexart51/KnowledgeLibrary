# Privacy and External Vault Safety

KnowledgeLibrary 6.3.0 treats connected vaults as read-only external sources.

## Guarantees

- No file mutation outside the active vault.
- No network calls for connector indexing.
- No AI calls.
- No full-content cache for conversations or documents.
- Conversation and document entries store only metadata, headings where relevant, short plain-text excerpts, and paths/open URIs.
- Tags are canonicalized in memory only for external entries.
- Unavailable Dropbox-synced folders are reported gracefully and do not block other connectors.

## Opening External Notes

Markdown notes use Obsidian URIs:

```text
obsidian://open?vault=<vault-name>&file=<encoded-relative-path>
```

The configured vault name is used because a folder name is not always the Obsidian display name.
## Universal Search Privacy

Universal Search uses only active-vault resource metadata and the metadata, headings, excerpts, and paths already stored in the unified index. It does not call AI services, perform network requests, rescan for every query, or write to connected vaults. Saved searches are stored only in plugin data.
