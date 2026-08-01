# Safe Deployment

KnowledgeLibrary 6.4.1 deploys only Obsidian build artifacts:

- `main.js`
- `manifest.json`
- `styles.css`

Existing plugin state files are preserved, including `data.json`, future cache files, future index files, saved searches, diagnostics, and any user-managed files in the installed plugin folder.

If the plugin folder does not exist, the deploy script creates it and copies the three artifacts.

Each deployment writes `deployment-report.md` in the target plugin folder with version, timestamp, files updated, files preserved, and warnings.
