# File Picker

The Add Resource wizard includes a searchable native vault file picker for local file resources. Users do not type vault paths manually.

## Filtering

The picker only lists files returned by the active vault. It supports searching by filename or folder path and excludes configured resource-note folders and unsafe maintenance areas.

Default exclusions include:

- `.obsidian`
- configured KnowledgeLibrary resource notes folder
- backups
- quarantine
- reports
- templates
- hidden folders

Allowed extensions and excluded folders are configurable in plugin settings. The default allowed extension list includes `*`, so unknown file types can still be added and classified through the default unknown type setting.

## Type Override

Selecting a file auto-detects the resource type from the extension and pre-fills the title from the filename. The type dropdown remains editable before saving, which supports book workflows such as classifying a PDF as `book`.

## Output

The selected original file is preserved. Confirming the wizard creates only a Markdown KnowledgeLibrary resource note. If an existing resource note already points to the same active vault file, the existing note opens instead of creating a duplicate.
