# Topic Discovery

Topics are discovered automatically from metadata already available in memory:

- tags
- collections
- title terms
- aliases stored in metadata
- topic lists stored in metadata
- relationship notes and relationship identifiers
- indexed headings when available

Discovery uses normalized display names and stable topic ids so `OpenRouter`, `open_router`, and `Open Router` collapse into one logical topic. Duplicate resources are suppressed using the same resource/video/url/path identity rules used by Home and Universal Search.

Topic discovery does not require users to manually create topics and does not write discovered topics back to notes.
