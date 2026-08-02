# UX Redesign Plan

This is a future design-first plan. It is not an implementation task.

## Ground Rules

- Keep `6.4.1 LTS` untouched during UX work.
- Use a separate experimental branch for implementation.
- Start with user workflows before code.
- Create low-fidelity screen designs first.
- Do not deploy UX experiments to the production vault.

## Views To Prototype

- Home
- Search
- Library
- Topics
- Documents
- Conversations
- Dashboard and settings only after primary workflows are clear

## Navigation Principles

- Normal plugin navigation must not depend on Ctrl+P.
- The interface must never rely on a blocking overlay as the only path to a primary workflow.
- Every primary view must be keyboard reachable.
- Navigation transitions must be acceptance-tested independently.
- The design must remain usable with 0, 50, 500, and 5000+ indexed items.

## Prototype Acceptance

Before implementation:

- Review the screen flow with first-time-user tasks.
- Validate empty, medium, and large library states.
- Define pass/fail criteria for each view.
- Identify which existing 6.4.1 services are reused.
- Confirm no connector, storage, deployment, or state architecture changes are needed.
