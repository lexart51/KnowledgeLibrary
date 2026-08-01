# Providers

Providers convert user input into normalized `KnowledgeResource` objects.

## Interface

Every provider implements `ResourceProvider`:

- `canHandle(input)`: returns whether the provider supports the input.
- `createResource(input)`: creates a resource from raw input.
- `normalize(resource)`: canonicalizes provider-specific fields.
- `validate(resource)`: reports whether required fields are present and coherent.

## Current Providers

### YouTubeProvider

Handles `youtube.com` and `youtu.be` URLs. It extracts the 11-character video ID, removes tracking and query noise, builds a canonical `https://www.youtube.com/watch?v=...` URL, and sets a deterministic thumbnail URL.

The provider asks YouTube oEmbed for title and creator through Obsidian `requestUrl`. If oEmbed fails, the resource remains active and falls back to a generic deterministic title and thumbnail.

### WebsiteProvider

Handles non-YouTube `http` and `https` URLs. It removes common tracking query parameters and uses the hostname as a fallback title/source.

### FileProvider

Handles local file inputs through `filePath` or `file://` URLs. It uses the file name as a fallback title.

## ProviderRegistry

`ProviderRegistry` stores providers in priority order and selects the first provider whose `canHandle(input)` returns true.

## ResourceService

`ResourceService` coordinates provider selection, resource creation, provider normalization, tag normalization, validation, and in-memory cache insertion.

## Compatibility Layer

The migration compatibility layer is separate from provider creation. It reads historical note formats, detects their legacy origin, and converts compatible notes into `KnowledgeResource` records in memory without modifying source notes.
