#!/usr/bin/env bash
set -euo pipefail

TARGET_PATH="${1:-/home/luiz/Dropbox/Cursos Livros Instrucoes/YouTubes/.obsidian/plugins/knowledge-library-v6}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET_BASENAME="$(basename "$TARGET_PATH")"

if [[ "$TARGET_BASENAME" == "knowledge-library" || "$TARGET_BASENAME" == "knowledge-library-v5" ]]; then
  echo "Refusing to deploy v6 into a v5 plugin folder: $TARGET_PATH" >&2
  exit 1
fi

cd "$ROOT_DIR"
npm run build:prod

if [[ -e "$TARGET_PATH" ]]; then
  BACKUP_PATH="$TARGET_PATH.backup-$(date +%Y%m%d-%H%M%S)"
  mv "$TARGET_PATH" "$BACKUP_PATH"
  echo "Backed up existing v6 target to $BACKUP_PATH"
fi

mkdir -p "$TARGET_PATH"
cp main.js manifest.json styles.css "$TARGET_PATH/"
echo "Deployed KnowledgeLibrary v6 to $TARGET_PATH"
