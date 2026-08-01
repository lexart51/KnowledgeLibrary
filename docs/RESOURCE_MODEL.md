# Resource Model

`KnowledgeResource` is the canonical active-vault resource shape for KnowledgeLibrary v6. It is intentionally broad enough to represent online media, websites, and local files while preserving provider-specific detail in `metadata`.

## Fields

- `id`: deterministic internal identifier generated from provider type and canonical source.
- `type`: resource family, including `youtube`, `website`, `pdf`, `book`, `powerpoint`, `document`, `markdown`, `image`, `script`, `skill`, `archive`, `file`, and `other`.
- `title`: display title.
- `creator`: author, channel, publisher, or creator when known.
- `source`: provider or origin label.
- `url`: canonical web URL when available.
- `filePath`: local vault or filesystem path when available.
- `thumbnail`: preview image URL or path when available.
- `tags`: normalized canonical tags.
- `status`: lifecycle status, currently `active`, `archived`, or `unavailable`.
- `favorite`: user favorite flag.
- `completed`: completion flag.
- `rating`: optional user rating.
- `createdAt`: ISO timestamp for resource creation.
- `updatedAt`: ISO timestamp for the last resource update.
- `metadata`: provider-specific structured data.

## Tag Normalization

Tags are lowercased, trimmed, converted from spaces to hyphens, canonicalized through aliases, and de-duplicated. For example, `ia`, `AI`, and `artificial intelligence` all resolve to `ai`.

## Organization Fields

Collections, progress, priority, and relationships are optional for backward compatibility. Legacy reads populate safe in-memory defaults and do not require migration during read-only use. Relationship types are `related`, `complements`, `contradicts`, `explains`, `prerequisite`, `continuation`, `source`, and `derived-from`.

## External References

KnowledgeLibrary 6.3.0 adds `ExternalResourceReference` for read-only connected vault entries. These references are metadata records, not active-vault resources, and include connector identity, vault name, role, external path, note title, resource type, source platform when applicable, tags, collections, created/updated times, open URI, and provider metadata.

Unified index entries can represent either active-vault resources or external references. They preserve connector/vault identity, type, title, creator, path, URL or open URI, tags, collections, excerpt, dates, status, favorite, and progress where available. External references are canonicalized in memory only; canonical tags and collections are not written back to connected vaults.
