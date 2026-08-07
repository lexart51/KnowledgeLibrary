# Project Status

## Recommended Production Version

`6.4.1 LTS` is the recommended daily-use version.

Stable release commit: `890ea68 Fix release version synchronization for 6.4.1`

## Local Paths

- Plugin source path: `D:\Dropbox\KnowledgeLibrary`
- Production vault path: `D:\Dropbox\OBSIDIAN\YouTubes`
- Conversation vault path: `D:\Dropbox\OBSIDIAN\AI_Chats`
- Document vault path: `D:\Dropbox\_Docs`

## Enabled Connector Roles

- YouTubes: resources
- AI_Chats: conversations
- `_Docs`: documents

Connectors are read-only. The vaults remain physically independent and are joined only through the unified metadata index stored in active-vault plugin data.

## Experimental 6.5 Status

The 6.5 alpha line is frozen as experimental history:

- `6.5.0-alpha.1`: Home
- `6.5.0-alpha.2`: Home deduplication hotfix
- `6.5.0-alpha.3`: Topic Pages
- `6.5.0-alpha.4`: Topic Page launch hotfix
- `6.5.0-alpha.5`: Topic Browser and navigation diagnostics
- `6.5.0-alpha.6`: persistent navigation shell

The installed alpha.6 runtime locked the interface after navigation between major views. It is not production ready.

## Safe To Use Today

Safe in the production 6.4.1 LTS installation:

- Active-vault resource Library.
- Add Resource workflows.
- Local file resources.
- Collections, progress, relationships, priority, and dashboard statistics.
- Read-only connectors for YouTubes, AI_Chats, and `_Docs`.
- Unified metadata index and Universal Search.
- Saved searches.
- Diagnostics, self diagnostics, backup/restore, configuration export/import.
- Artifact-only deployment scripts for approved 6.4.1 artifacts.

## Must Not Be Deployed

- Do not deploy `6.5.0-alpha.1` through `6.5.0-alpha.6` to the production vault.
- Do not deploy alpha.6 generated artifacts from `8d5fd36` to daily use.
- Do not physically merge vaults.
- Do not modify connected external vaults during documentation or UX planning work.

## Recovery To 6.4.1

1. Confirm the production vault path: `D:\Dropbox\OBSIDIAN\YouTubes`.
2. Confirm the plugin folder: `.obsidian\plugins\knowledge-library-v6` inside that vault.
3. Restore or rebuild artifacts from commit `890ea68`.
4. Copy only `main.js`, `manifest.json`, and `styles.css` into the plugin folder.
5. Preserve `data.json`, backups, cache, saved searches, diagnostics, and any future state files.
6. Restart Obsidian and confirm the status bar reads `KL 6.4.1`.
7. Run `Knowledge Library: Run self diagnostics` and verify connector/index/state readability.
