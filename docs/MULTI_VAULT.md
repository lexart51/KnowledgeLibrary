# Multi-Vault Knowledge Ecosystem

This document describes the stable read-only multi-vault architecture used by the `6.4.1 LTS` production installation.


KnowledgeLibrary 6.3.0 connects independent vaults through read-only connector configuration and a unified metadata index. It does not merge vaults physically and does not move, rename, or modify external vault content.

## Example Connectors

The default settings include disabled example connector configurations for:

- `YouTubes` as a resources connector
- `AI_Chats` as a conversations connector
- `_Docs` as a documents connector

They are examples only. Users can edit paths, vault names, roles, include/exclude patterns, icons, and color tokens before enabling them.

## Connector Roles

- `resources`: KnowledgeLibrary resource notes and compatible legacy Video Knowledge Manager notes.
- `conversations`: Markdown chat notes from ChatGPT, Claude, Gemini, and related folders.
- `documents`: Markdown catalog notes and represented local document files.
- `custom`: generic document-style indexing.

## Storage

The unified index is rebuildable and stored in active-vault plugin data. External vaults are never written by connector scans.
