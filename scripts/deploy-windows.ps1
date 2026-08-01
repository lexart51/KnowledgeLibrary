param(
  [string]$TargetPath = "D:\Dropbox\Cursos Livros Instrucoes\YouTubes\.obsidian\plugins\knowledge-library-v6"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$target = [System.IO.Path]::GetFullPath($TargetPath)
$v5Names = @("knowledge-library", "knowledge-library-v5")

if ($v5Names -contains (Split-Path -Leaf $target)) {
  throw "Refusing to deploy v6 into a v5 plugin folder: $target"
}

Push-Location $root
try {
  npm run build:prod

  if (Test-Path $target) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backup = "$target.backup-$timestamp"
    Move-Item -LiteralPath $target -Destination $backup
    Write-Host "Backed up existing v6 target to $backup"
  }

  New-Item -ItemType Directory -Force -Path $target | Out-Null
  Copy-Item -LiteralPath "main.js" -Destination (Join-Path $target "main.js")
  Copy-Item -LiteralPath "manifest.json" -Destination (Join-Path $target "manifest.json")
  Copy-Item -LiteralPath "styles.css" -Destination (Join-Path $target "styles.css")
  Write-Host "Deployed KnowledgeLibrary v6 to $target"
} finally {
  Pop-Location
}
