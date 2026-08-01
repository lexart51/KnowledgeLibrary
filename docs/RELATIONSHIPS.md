# Relationships

KnowledgeLibrary 6.2.0 stores resource relationships in resource frontmatter:

```yaml
related_resources:
  - resource_id: kl_example
    relationship_type: explains
    note: Background context
```

Supported relationship types:

- `related`
- `complements`
- `contradicts`
- `explains`
- `prerequisite`
- `continuation`
- `source`
- `derived-from`

Relationships are directed. A resource can have outgoing relationships, and other resources can point to it as incoming relationships.

## Safety Rules

The relationship service rejects self-relationships and exact duplicates. References to missing resources are tolerated and shown by id instead of crashing.

## Editor

`Knowledge Library: Edit selected resource` includes a Related resources section with a resource picker, relationship type selector, optional note, open action, and remove action.
