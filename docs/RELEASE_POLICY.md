# Release Policy

## Release Types

Stable releases are approved for daily production use only after real Obsidian testing in the intended vault workflow.

Maintenance releases fix reliability, deployment, diagnostics, state preservation, compatibility, or release integrity without changing user-facing architecture.

Alpha releases are experimental and may be incomplete or unstable. They must not be recommended for production.

Beta releases are broader test candidates. They still require explicit production acceptance before deployment.

Release candidates are intended stabilization builds but are not stable until accepted in real Obsidian use.

## Production Acceptance Checklist

- Real Obsidian launch succeeds in the target vault.
- Plugin status bar version is correct.
- Core commands open visible views or clear Notices.
- Library, Add Resource, Universal Search, dashboard, diagnostics, and connector status are usable.
- External connectors remain read-only.
- No source data is moved, renamed, deleted, or rewritten unexpectedly.
- No interface lock or blocking overlay prevents normal use.
- Rollback procedure has been tested or confirmed.

## Version Integrity Checklist

Verify all version sources agree:

- `package.json`
- `package-lock.json`
- `manifest.json`
- compiled `main.js`
- status bar label
- plugin state `versionLabel` behavior
- deployment report version
- documentation status text

## Deployment Checklist

- Build approved artifacts only.
- Copy only `main.js`, `manifest.json`, and `styles.css`.
- Preserve `data.json` and all plugin state/cache/index/diagnostics/saved-search files.
- Generate and review `deployment-report.md`.
- Run self diagnostics after Obsidian restart.

## Rollback Checklist

- Stop using the faulty build.
- Restore approved stable artifacts.
- Preserve plugin state files.
- Confirm status bar version.
- Run self diagnostics.
- Record the cause and outcome in docs before further release work.

## Documentation Requirements

Every release must update README, CHANGELOG, ROADMAP, TODO, ISSUES, and any affected docs. Documentation must distinguish production state from experimental history.

## Stability Rule

Do not call any release stable before real Obsidian testing confirms it in the intended production workflow.
