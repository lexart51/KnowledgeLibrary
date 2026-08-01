#!/usr/bin/env bash
set -euo pipefail

TARGET_PATH="${1:-/home/luiz/Dropbox/Cursos Livros Instrucoes/YouTubes/.obsidian/plugins/knowledge-library-v6}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET_BASENAME="$(basename "$TARGET_PATH")"
ARTIFACTS=(main.js manifest.json styles.css)
UPDATED=()
PRESERVED=()
WARNINGS=()

if [[ "$TARGET_BASENAME" == "knowledge-library" || "$TARGET_BASENAME" == "knowledge-library-v5" ]]; then
  echo "Refusing to deploy v6 into a v5 plugin folder: $TARGET_PATH" >&2
  exit 1
fi

cd "$ROOT_DIR"
npm run build:prod

if [[ ! -d "$TARGET_PATH" ]]; then
  mkdir -p "$TARGET_PATH"
else
  while IFS= read -r name; do
    preserve=true
    for artifact in "${ARTIFACTS[@]}"; do
      [[ "$name" == "$artifact" ]] && preserve=false
    done
    [[ "$preserve" == true ]] && PRESERVED+=("$name")
  done < <(find "$TARGET_PATH" -mindepth 1 -maxdepth 1 -printf '%f\n')
fi

for artifact in "${ARTIFACTS[@]}"; do
  if [[ ! -f "$ROOT_DIR/$artifact" ]]; then
    WARNINGS+=("Missing build artifact: $artifact")
    continue
  fi
  cp "$ROOT_DIR/$artifact" "$TARGET_PATH/$artifact"
  UPDATED+=("$artifact")
done

VERSION=$(node -p "require('./manifest.json').version")
REPORT="$TARGET_PATH/deployment-report.md"
{
  echo "# KnowledgeLibrary Deployment Report"
  echo
  echo "- Version: $VERSION"
  echo "- Timestamp: $(date --iso-8601=seconds)"
  echo "- Target: $TARGET_PATH"
  echo
  echo "## Files Updated"
  if [[ ${#UPDATED[@]} -eq 0 ]]; then echo "- None"; else printf -- '- %s\n' "${UPDATED[@]}"; fi
  echo
  echo "## Files Preserved"
  if [[ ${#PRESERVED[@]} -eq 0 ]]; then echo "- None"; else printf -- '- %s\n' "${PRESERVED[@]}"; fi
  echo
  echo "## Warnings"
  if [[ ${#WARNINGS[@]} -eq 0 ]]; then echo "- None"; else printf -- '- %s\n' "${WARNINGS[@]}"; fi
} > "$REPORT"

echo "Deployed KnowledgeLibrary v6 artifacts to $TARGET_PATH"
