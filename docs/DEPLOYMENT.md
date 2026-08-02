# Deployment

Recommended production deployment is `6.4.1 LTS` to the active YouTubes vault only.

Do not deploy the 6.5 alpha line to the production vault. The `6.5.0-alpha.6` installed runtime locked the interface after navigation between major views and was rolled back.

## Plugin Identity

- Plugin id: `knowledge-library-v6`
- Plugin folder: `knowledge-library-v6`
- Recommended production version: `6.4.1 LTS`
- Stable commit: `890ea68 Fix release version synchronization for 6.4.1`

## Production Build

```bash
npm run build:prod
```

The build produces the only files required for deployment:

- `main.js`
- `manifest.json`
- `styles.css`

## Production Target

```text
D:\Dropbox\Cursos Livros Instrucoes\YouTubes\.obsidian\plugins\knowledge-library-v6
```

This folder is inside the active production Obsidian vault. Connected vaults are not deployment targets.

## Safe Deployment Rule

Deployment must update only build artifacts:

- `main.js`
- `manifest.json`
- `styles.css`

Deployment must preserve:

- `data.json`
- future state files
- future cache files
- future index files
- saved searches
- diagnostics
- deployment reports
- any user-managed files in the installed plugin folder

## Windows

Run only with approved stable artifacts:

```powershell
.\scripts\deploy-windows.ps1
```

Run with a custom target only when the target is the intended `.obsidian\plugins\knowledge-library-v6` folder:

```powershell
.\scripts\deploy-windows.ps1 "D:\path\to\.obsidian\plugins\knowledge-library-v6"
```

## Linux

Linux deployment is supported by script, but the verified daily-use environment is Windows.

```bash
bash scripts/deploy-linux.sh "/path/to/.obsidian/plugins/knowledge-library-v6"
```

## Rollback To 6.4.1

1. Restore or rebuild artifacts from commit `890ea68`.
2. Copy only `main.js`, `manifest.json`, and `styles.css` to the production plugin folder.
3. Preserve plugin state files.
4. Restart Obsidian.
5. Confirm status bar `KL 6.4.1`.
6. Run `Knowledge Library: Run self diagnostics`.
