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
- A second, distinct alpha.6 defect was found during isolated diagnostic testing (see below): the shared navigation bar renders with its lower portion clipped and button labels invisible on the Dashboard view, though the interface remains fully responsive.

## Alpha.6 Isolated Diagnostic (August 2026)

Alpha.6 (`v6.5.0-alpha.6-experimental`, commit `8d5fd36`) was deployed under a distinct plugin id into an isolated, non-production test vault (empty vault, no connectors enabled, separate from the 6.4.1 baseline install) specifically to investigate the documented interface-lock defect without risk to production. Findings:

- Static review of `NavigationShell.ts` and the views that call it found no global `document`/`window` event listeners, no `pointer-events` or focus-trap CSS, and a correct `existingLeaf ?? getLeaf(true)` reuse pattern for navigation. None of the usual suspects for a full interface lock were present in the code.
- Manual navigation through Home, Search, Library, Topics, Collections, Dashboard, and the Add Resource modal, including rapid repeated clicks, did not reproduce the documented full interface lock in this isolated vault. The lock may require conditions not present in a fresh empty vault (real data volume, a longer session, or a specific transition sequence), or may be intermittent.
- A separate, milder defect was found and confirmed reproducible: after navigating Library then Dashboard, the shared navigation bar's buttons render with only their top edge visible and no visible label text, while remaining fully clickable and functional. This is not the documented lock — the interface stays responsive and tab switching is unaffected.
- The clipping is persistent, not a transient repaint glitch: it survives scrolling and window resize/maximize, ruling out a stale-paint/compositing cause and a flex-wrap two-row height-reservation cause.
- Root cause was not pinned to an exact line. The strongest remaining lead is the shared navigation styles being defined twice in `styles.css` (`~line 1203` and `~line 1270`), with the second block adding `position: sticky; top: 0; z-index: 5` — a plausible source of a layout height-reservation mismatch against Obsidian's own scrollable view-content container. This should be the starting point for anyone investigating alpha.6 further.
- Neither finding affects the 6.4.1 LTS baseline, which was verified clean in the same isolated-vault methodology before alpha.6 was tested.

## Future UX Work

UX must be prototyped before another large implementation. Future work should start with user workflows and low-fidelity screens, then validate each view independently in Obsidian. Experimental implementation belongs on a separate branch and must not disturb the 6.4.1 production baseline.
