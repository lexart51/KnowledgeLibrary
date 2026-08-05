# Query Syntax

Plain text searches across title, creator, tags, collections, excerpt, headings, platform, connector, vault, type, file name, file path, and safe textual metadata.

Optional filters can be added inline:

- `source:`
- `vault:`
- `role:`
- `type:`
- `tag:`
- `collection:`
- `platform:`
- `status:`
- `favorite:true|false`
- `progress:not-started|in-progress|completed`
- `priority:low|normal|high`

Quoted values are supported for multi-word filters.

Examples:

```text
wireguard source:AI_Chats
mikrotik type:pdf
hermes platform:chatgpt
retirement collection:"Retirement Automation"
tag:security favorite:true
```
