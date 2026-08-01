# Specialized Add Resource Forms

KnowledgeLibrary 6.1.0 keeps one `AddResourceModal` shell and one persistence path, but the visible fields now change by resource type.

## Shared Architecture

All resource forms submit through the same pipeline:

1. `AddResourceModal` owns centralized typed form state and validation.
2. Type-specific renderers show only fields relevant to the selected resource type.
3. `AddResourceService` receives one `AddResourceRequest` shape.
4. `ProviderRegistry`, `ResourceService`, and `VaultResourceRepository` perform provider selection, resource normalization, duplicate checks, and Markdown note persistence.

The modal does not duplicate persistence logic for any resource type.

## Form Types

- YouTube: URL, tags, notes, and optional manual title/creator disclosure.
- Website: URL, tags, notes, and optional manual title/creator-publisher disclosure.
- PDF: vault file picker plus optional title, author, and category/subject.
- Book: vault PDF/EPUB file or external URL plus title, author, publisher, edition, and ISBN.
- PowerPoint: vault file picker plus title, author/organization, and presentation date.
- Word/Text Document: vault file picker plus title, author/organization, and document date.
- Markdown: vault file picker plus title, author, and source/project.
- Image: vault file picker, local preview when available, title, creator/source, and description.
- Script: vault file picker, selected filename/extension, title, inferred language, project, entry point/command, and creator.
- Skill: vault file picker plus title, platform/environment, version, entry file/path, description, and creator.
- ZIP/Archive: vault file picker plus title, archive format, description/source, and creator.
- Other: vault file or external URL plus title, creator/source, and subtype.

## Type Switching

Switching resource type preserves common tags and notes. Fields that cannot apply to the new type, such as URL for file-only resources or file path for web-only resources, are cleared safely. When a file is already selected and the selected type is file-based, extension detection can recompute the most specific type.

## Validation

Validation is type-specific and appears next to the relevant field. URL-only resources require a URL. File-only resources require a vault file. Book and Other require either a vault file or URL.

## Modal Sizing

The modal sizes naturally to its visible fields. It uses viewport-safe max dimensions, vertical scrolling only when content exceeds the viewport, responsive one-column layout below `760px`, and no horizontal overflow.
