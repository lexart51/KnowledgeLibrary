# Safe Deployment

KnowledgeLibrary `6.4.1 LTS` is the recommended production baseline for safe deployment.

Safe deployment updates only Obsidian build artifacts:

- `main.js`
- `manifest.json`
- `styles.css`

Existing plugin state files are preserved, including `data.json`, future cache files, future index files, saved searches, diagnostics, and any user-managed files in the installed plugin folder.

If the plugin folder does not exist, the deploy script creates it and copies the three artifacts.

Each deployment writes `deployment-report.md` in the target plugin folder with version, timestamp, files updated, files preserved, and warnings.

Do not deploy `6.5.0-alpha.6` or any 6.5 alpha artifact to production. The alpha.6 runtime was rolled back after a blocking navigation lock.
