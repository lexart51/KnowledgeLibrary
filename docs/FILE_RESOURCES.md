# File Resources

Milestone 6 makes local vault files first-class Knowledge Library resources. The original file stays in place; the plugin creates only a Markdown resource note.

## Supported Types

KnowledgeLibrary detects file resources from vault-relative paths:

- PDF: `.pdf`
- PowerPoint: `.ppt`, `.pptx`
- Documents: `.doc`, `.docx`, `.txt`
- Books: `.epub`; PDFs can also be manually classified as `book`
- Markdown: `.md`, `.markdown`
- Images: common raster/vector formats including `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.bmp`, `.avif`, `.tif`, `.tiff`
- Scripts/source code: common extensions such as `.js`, `.ts`, `.py`, `.rb`, `.ps1`, `.sh`, `.css`, `.html`, `.json`, `.yaml`, `.sql`, `.go`, `.rs`, `.java`, `.c`, `.cpp`, `.cs`, `.php`, `.lua`, `.r`, `.swift`
- Archives: `.zip`, `.7z`, `.rar`, `.tar`, `.gz`, `.tgz`, `.bz2`, `.xz`
- Unknown files: classified using the configured default unknown type

## Metadata

When available from Obsidian file stats and extension mapping, resource notes store filename, extension, size, created time, modified time, vault-relative path, parent folder, MIME type, script language, archive format, and document format. Image dimensions are reserved as nullable metadata when they cannot be obtained without extra dependencies.

## Identity

File resource IDs are deterministic from the normalized vault-relative path. Duplicate detection uses the normalized active path first and can recognize likely moved files by matching stored filename, size, and modified time. File contents are not read or hashed yet.

## Cards

File cards show a type placeholder for non-image files. Image resources render through Obsidian vault resource paths. Cards show filename, author when supplied, resource type, optional file size, parent folder, and a missing marker when the original file is no longer present.

Opening the note opens the Markdown resource note. Opening the resource opens the original vault file. Missing originals are never deleted automatically.
