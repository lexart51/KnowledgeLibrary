# Navigation

> **Experimental 6.5 UX document.** This document describes navigation work from the experimental 6.5 UX line. It is retained for design history and is not part of the recommended 6.4.1 production workflow.

KnowledgeLibrary 6.5.0-alpha.6 attempted to make Home and a shared navigation shell the primary way to reach normal plugin workflows.

## Production Context

The recommended production version is `6.4.1 LTS`. In 6.4.1, normal access remains through the stable Library, Dashboard, Universal Search, connector, diagnostics, and settings commands. The 6.5 navigation shell is not production approved because the installed alpha.6 runtime locked the interface after navigation between major views.

## Experimental Entry Points

The alpha line explored:

- Home as the default entry point.
- `Knowledge Library: Topics` as a persistent Topic Browser view.
- `Knowledge Library: Open topic page` as a quick picker with fallback behavior.
- `Knowledge Library: Test Topic Navigation` as a diagnostic command.
- A shared shell across Home, Library, Universal Search, Dashboard, Topic Page, Topics, Collections management, and Settings.

## Lessons For Future UX

Future navigation must be prototyped before implementation, must not depend on Ctrl+P for normal workflows, and must never rely on a blocking overlay as the only path to a primary feature. See `docs/UX_REDESIGN_PLAN.md`.
