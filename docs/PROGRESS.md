# Progress

KnowledgeLibrary 6.2.0 adds optional progress frontmatter:

```yaml
progress: 40
progress_unit: pages
current_position: 20
total_units: 50
completed: false
```

`progress` is always normalized to `0` through `100`. Negative values are rejected, and totals must be greater than zero before percentage calculation.

## Units

Supported progress units:

- `percent`
- `pages`
- `slides`
- `chapters`
- `minutes`
- `custom`

PDF and Book forms use page fields. PowerPoint uses slide fields. YouTube and generic resources use percentage.

## Completed Sync

`completed: true` sets progress to `100`. A resource with progress `100` is treated as completed. Setting completed false does not delete explicit current/total position fields.

## Cards and Filters

Cards show a compact progress bar when progress is greater than zero, including current/total text where available. The toolbar can filter Not started, In progress, and Completed resources, and resources can be sorted by progress.
