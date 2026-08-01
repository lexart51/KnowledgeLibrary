# UI/UX

Version `6.1.0` keeps the polished Knowledge Library view and replaces the generic Add Resource form with specialized type-specific forms. It does not change repository, migration, provider, or resource model behavior beyond passing optional form metadata through the existing AddResourceService request.

## Add Resource Modal

The modal uses a desktop-friendly `960px` max width with responsive one-column behavior on narrow screens. Labels remain above fields, file picking is visually prominent for file-backed resources, and Add/Cancel actions stay sticky at the bottom of the modal content.

The type selector is constrained to the modal width, fields are conditionally shown by resource type, and validation messages are placed near URL or vault-file fields when those fields are the source of the error.

## Library View

The library keeps full vertical scrolling through `.knowledge-library-scroll`. The toolbar is split into search, filters, and toggles so controls can wrap cleanly without horizontal scrolling.

Cards use consistent spacing, resource-type badges, icon placeholders, bottom-aligned actions, wrapped/truncated titles and metadata, and a clearer missing-file state. YouTube and image resources keep image thumbnails; other resource types use polished text-icon placeholders.

## Theme and Accessibility

Styles use Obsidian CSS variables only, so light and dark themes inherit Obsidian colors. Buttons and controls have `aria-label` and `title` attributes where useful, and keyboard focus uses `:focus-visible` with `--interactive-accent`.

## Settings

Settings are grouped into Storage, Migration and safety, Tags, File resources, and Display. Existing setting keys and defaults are unchanged.

## 6.0.0-rc.2 Modal Overflow Hotfix

The Add Resource modal now uses `width: min(960px, calc(100vw - 48px))` and `max-width: calc(100vw - 48px)`. The modal scrolls vertically only, its grid columns use `minmax(0, 1fr)`, and full-width rows such as Tags, validation, file picker, and actions span both columns. At narrow widths the form switches to one column at `760px`.

## 6.1.0 Specialized Forms

YouTube and Website forms are minimal by default and expose manual Title/Creator fields only through an optional disclosure. File-backed resources reuse the searchable vault file picker and expose type-specific metadata fields for PDFs, books, presentations, documents, Markdown, images, scripts, skills, archives, and generic resources. Switching type preserves common Tags and Notes while clearing incompatible source fields safely.
