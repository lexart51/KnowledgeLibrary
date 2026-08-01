# Dashboard

KnowledgeLibrary 6.2.0 added a lightweight dashboard opened with `Knowledge Library: Open Dashboard`. KnowledgeLibrary 6.3.0 extends the same dashboard for the unified knowledge ecosystem.

The dashboard reads existing active-vault resource notes and cached unified-index metadata. It does not call AI services, fetch external metadata, write to external vaults, or cache full conversation/document contents.

## Metrics

The dashboard shows:

- total resources
- count by type
- count by collection
- not started
- in progress
- completed
- favorites
- high priority
- missing files
- recently added resources
- recently updated resources

## Connector Status

When a unified index exists, the dashboard also shows:

- connector availability
- indexed item count per connector
- last successful scan
- connector errors
- counts by role
- counts by vault
- counts by conversation platform
- refresh connector action
- rebuild all action

Unavailable Dropbox-synced or disconnected vault paths are shown as unavailable without blocking counts for available connectors.
## Universal Search Integration

KnowledgeLibrary 6.4.0 adds a prominent Universal Search action, unified role counts, connector counts, and recent conversations/documents/resources sourced from the cached unified index.
