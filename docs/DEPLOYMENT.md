# Deployment

KnowledgeLibrary v6 beta deploys side by side with existing v5 installs.

## Plugin Identity

- Plugin id: `knowledge-library-v6`
- Plugin folder: `knowledge-library-v6`
- Version: `6.0.0-beta.1`

The deployment scripts refuse v5 folder names such as `knowledge-library` and `knowledge-library-v5`.

## Production Build

```bash
npm run build:prod
```

The build produces the only files required for deployment:

- `main.js`
- `manifest.json`
- `styles.css`

## Windows

Default target:

```text
D:\Dropbox\Cursos Livros Instrucoes\YouTubes\.obsidian\plugins\knowledge-library-v6
```

Run with the default target:

```powershell
.\scripts\deploy-windows.ps1
```

Run with a custom target:

```powershell
.\scripts\deploy-windows.ps1 "D:\path\to\.obsidian\plugins\knowledge-library-v6"
```

## Linux

Default target:

```text
/home/luiz/Dropbox/Cursos Livros Instrucoes/YouTubes/.obsidian/plugins/knowledge-library-v6
```

Run with the default target:

```bash
bash scripts/deploy-linux.sh
```

Run with a custom target:

```bash
bash scripts/deploy-linux.sh "/path/to/.obsidian/plugins/knowledge-library-v6"
```

## Backup Behavior

If the v6 target folder already exists, the scripts move it to a timestamped sibling backup before copying the new production files. They do not overwrite or remove the current v5 plugin folder.
