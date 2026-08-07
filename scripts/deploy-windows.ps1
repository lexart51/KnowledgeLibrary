param(
  [string]$TargetPath = "D:\Dropbox\OBSIDIAN\YouTubes\.obsidian\plugins\knowledge-library-v6"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$target = [System.IO.Path]::GetFullPath($TargetPath)
$v5Names = @("knowledge-library", "knowledge-library-v5")
$artifactNames = @("main.js", "manifest.json", "styles.css")
$updated = @()
$preserved = @()
$warnings = @()

if ($v5Names -contains (Split-Path -Leaf $target)) {
  throw "Refusing to deploy v6 into a v5 plugin folder: $target"
}

Push-Location $root
try {
  npm run build:prod

  if (-not (Test-Path $target)) {
    New-Item -ItemType Directory -Force -Path $target | Out-Null
  } else {
    Get-ChildItem -LiteralPath $target -Force | ForEach-Object {
      if ($artifactNames -notcontains $_.Name) {
        $preserved += $_.Name
      }
    }
  }

  foreach ($artifact in $artifactNames) {
    $source = Join-Path $root $artifact
    if (-not (Test-Path $source)) {
      $warnings += "Missing build artifact: $artifact"
      continue
    }
    Copy-Item -LiteralPath $source -Destination (Join-Path $target $artifact) -Force
    $updated += $artifact
  }

  $manifest = Get-Content -LiteralPath (Join-Path $root "manifest.json") -Raw | ConvertFrom-Json
  $timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssK"
  $report = @(
    "# KnowledgeLibrary Deployment Report",
    "",
    "- Version: $($manifest.version)",
    "- Timestamp: $timestamp",
    "- Target: $target",
    "",
    "## Files Updated",
    ($updated | ForEach-Object { "- $_" }),
    "",
    "## Files Preserved",
    ($(if ($preserved.Count -gt 0) { $preserved | ForEach-Object { "- $_" } } else { "- None" })),
    "",
    "## Warnings",
    ($(if ($warnings.Count -gt 0) { $warnings | ForEach-Object { "- $_" } } else { "- None" }))
  )
  $report | Set-Content -LiteralPath (Join-Path $target "deployment-report.md")
  Write-Host "Deployed KnowledgeLibrary v6 artifacts to $target"
} finally {
  Pop-Location
}
