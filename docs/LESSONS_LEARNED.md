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
- Alpha.6 persistent navigation shell work was blamed for a runtime interface lock after navigation between major views. Isolated diagnostic testing (see below) found no genuine unresponsive lock; the likely real cause was a navigation-bar text-rendering defect that made the interface look frozen without actually being frozen.
- The confirmed alpha.6 defect is narrower and precise: on the Library and Dashboard views only, the shared navigation bar's button labels disappear (buttons stay outlined and fully clickable) until a different view is opened, at which point rendering corrects itself immediately. Home, Search, Topics, Collections, and Settings are unaffected. See below for the identified cause and candidate fix.

## Alpha.6 Isolated Diagnostic (August 2026)

Alpha.6 (`v6.5.0-alpha.6-experimental`, commit `8d5fd36`) was deployed under a distinct plugin id into an isolated, non-production test vault (empty vault, no connectors enabled, separate from the 6.4.1 baseline install) specifically to investigate the documented interface-lock defect without risk to production. Findings:

- Static review of `NavigationShell.ts` and the views that call it found no global `document`/`window` event listeners, no `pointer-events` or focus-trap CSS, and a correct `existingLeaf ?? getLeaf(true)` reuse pattern for navigation. None of the usual suspects for a full interface lock were present in the code.
- Manual navigation through Home, Search, Library, Topics, Collections, Dashboard, and the Add Resource modal, including rapid repeated clicks, did not reproduce a genuine unresponsive lock. The interface remained clickable and tab switching worked at all times.
- A precise, confirmed defect was reproduced instead: on the Library and Dashboard views specifically, the shared navigation bar's button labels render invisible while the buttons remain fully clickable in place. Opening any other view (Home, Search, Topics, Collections, Settings) immediately restores correct rendering, including for the nav bar left behind on the Library/Dashboard leaf.
- The defect correlates exactly with one CSS difference. Library's container (`.knowledge-library-view`) and Dashboard's container (`.knowledge-library-dashboard`) both rely on `overflow: visible` (no explicit scroll region of their own). Home's container (`.knowledge-library-home-view`) and Topics's container (`.knowledge-library-topics-view`) both declare `overflow-y: auto; overflow-x: hidden`. The two views without their own scroll region are exactly the two that break; the two that declare one work correctly. This is consistent with a `position: sticky` containing-block/paint bug in the shared nav bar (`styles.css`, `.knowledge-library-shell-nav`, `position: sticky; top: 0`) when it resolves its scrolling ancestor through an outer Obsidian container instead of a view-owned one.
- A candidate fix for Dashboard was built and live-tested, and it did not work. Dashboard's container (`.knowledge-library-dashboard`) had no competing design constraint, so `overflow-y: auto; overflow-x: hidden; height: 100%; min-height: 0;` was added to it directly, isolated into its own rule so it would not leak onto the unrelated selectors it originally shared a declaration block with (`.knowledge-library-progress-field`, `.knowledge-library-editor-form`, `.knowledge-library-relationships-section`, `.knowledge-library-management-list`). It passed all 168 existing tests and was deployed to the isolated alpha.6 test vault. Live testing after a full Obsidian restart (ruling out stale-leaf state) confirmed Dashboard's nav bar labels are still invisible with this change in place. The `overflow` correlation, while real, is not the actual root cause for Dashboard, or is not sufficient on its own.
- Library's nav bar labels were observed rendering correctly in the same live test, without any change to Library's own CSS (`.knowledge-library-view` was deliberately left untouched, for the reason below). This was not caused by anything done here and is not understood; it may be an incidental effect of Obsidian reloading the whole stylesheet after the file changed, independent of which specific rule changed, but that is a guess, not a verified explanation.
- Library's container also cannot safely use the same fix that was tried for Dashboard, independent of the above. It intentionally uses `overflow: visible` so a separate dedicated child, `.knowledge-library-scroll`, handles scrolling for the card grid alone while the header/toolbar stay fixed — a real, already-tested design (`tests/library-view.test.ts` asserts `overflow: visible` on this selector). The nav bar renders as a sibling of `.knowledge-library-scroll`, not inside it, so it ends up sticky relative to Obsidian's outer container rather than the vault's own scroll region. Fixing Library correctly, if its improved behavior does not hold up, means moving the nav bar's render call inside `.knowledge-library-scroll`, which is real implementation work, not a CSS-only patch.
- This diagnostic effort is being closed here rather than continued with further speculative CSS changes. Remote, screenshot-relayed debugging (no direct DevTools access, no way to inspect computed styles or live-edit and observe in real time) has reached its practical limit for this specific bug. Whoever picks this up next should work directly at the machine with DevTools open, not repeat this remote process.
- Neither finding affects the 6.4.1 LTS baseline, which was verified clean in the same isolated-vault methodology before alpha.6 was tested.

## Future UX Work

UX must be prototyped before another large implementation. Future work should start with user workflows and low-fidelity screens, then validate each view independently in Obsidian. Experimental implementation belongs on a separate branch and must not disturb the 6.4.1 production baseline.
