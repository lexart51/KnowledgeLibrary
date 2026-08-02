# Knowledge Navigator Home

> **Experimental 6.5 UX document.** This document describes the experimental 6.5 UX line. It is retained for design history and is not part of the recommended 6.4.1 production workflow.


KnowledgeLibrary 6.5 introduces `Knowledge Library: Home` as the navigation-first landing view.

Home uses existing active-vault resources and the existing unified index. It does not rescan connectors, write to external vaults, or change the storage format. Home sections display duplicate-suppressed logical items, preferring active-vault resources over external connector copies when they represent the same underlying resource.

## Sections

- Search Everything: large search input that opens Universal Search when Enter is pressed.
- Continue Learning: duplicate-suppressed unfinished items with explicit learning signals, including partial progress, a valid current position, a recorded recent open, or high-priority unfinished status.
- Recent Activity: Today, Yesterday, and This Week timeline groups using last-opened dates when available, otherwise updated dates.
- Recent Resources: recently updated resource entries.
- Recent Conversations: recently updated conversation references.
- Recent Documents: recently updated document references.
- Favorite Collections: collection shortcuts inferred from favorite, high-priority, or in-progress items.
- Most Used Tags: top 20 tag cloud with usage-weighted sizes.

## Empty State

New libraries show actions for adding the first resource, connecting another vault, importing resources, and opening documentation.

## Settings

The Home settings section controls Continue Learning, Timeline, Tag Cloud, and the default startup page used by the ribbon icon.
