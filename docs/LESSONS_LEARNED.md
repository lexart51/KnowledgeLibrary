# Lessons Learned

## Project Evolution

KnowledgeLibrary evolved from Video Knowledge Manager and earlier video/resource-note workflows into a broader Obsidian knowledge system. The compatibility layer and migration tools remain important because older Video Knowledge Manager notes and legacy Knowledge Library notes still carry useful production data.

## Source And Vault Separation

The plugin source repository at `D:\Dropbox\KnowledgeLibrary` must stay separate from vault data. Source code, tests, docs, and Git history belong in the repository. Daily-use notes and plugin state belong in the active Obsidian vault installation.

## Multi-Vault Connector Architecture

The 6.3 architecture was the right boundary: resource, conversation, and document vaults remain independent, and the plugin reads external vault metadata through connectors. The unified index gives one logical search surface without physically merging vaults.

## Deployment State Loss

Early deployment replaced the installed plugin folder and caused `data.json` loss. The corrected deployment model updates only build artifacts: `main.js`, `manifest.json`, and `styles.css`. State files must be preserved across every deployment.

## Version Synchronization

A release can appear successful while Obsidian still reports an old version if package metadata, manifest, compiled bundle constants, status labels, deployment reports, and persisted `versionLabel` disagree. Release-version synchronization checks became mandatory after the 6.4.1 audit.

## Stable Baseline Value

`6.4.1 LTS` is valuable because it stabilizes deployment, state preservation, diagnostics, backup/restore, and release integrity on top of the 6.4 Universal Search and 6.3 connector architecture.

## 6.5 UX Findings

The 6.5 alpha line exposed real UX risks:

- Home duplicate-resource issues appeared when active-vault items and YouTubes connector entries represented the same YouTube resource.
- Continue Learning became noisy when it treated every unfinished item as active learning.
- Topic Page command paths could silently fail, producing no useful modal, view, or Notice.
- Modal-only navigation was not robust enough for primary workflows.
- Alpha.6 persistent navigation shell work still caused a runtime interface lock after navigation between major views.

## Future UX Work

UX must be prototyped before another large implementation. Future work should start with user workflows and low-fidelity screens, then validate each view independently in Obsidian. Experimental implementation belongs on a separate branch and must not disturb the 6.4.1 production baseline.
