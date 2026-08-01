# Resource Model

`KnowledgeResource` is the canonical resource shape for KnowledgeLibrary v6. It is intentionally broad enough to represent online media, websites, and local files while preserving provider-specific detail in `metadata`.

## Fields

- `id`: deterministic internal identifier generated from provider type and canonical source.
- `type`: resource family, currently `youtube`, `website`, or `file`.
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
