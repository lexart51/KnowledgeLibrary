# Topic Pages

KnowledgeLibrary 6.5.0-alpha.3 adds `Knowledge Topic` pages as a topic-oriented navigation surface over the existing active-vault resources and unified index.

A Topic Page is read-only. It does not create, move, rename, delete, or rewrite vault content. It groups existing resources, conversations, documents, collections, timeline activity, related topics, and topic-scoped Continue Learning into one view.

Open a Topic Page from the command palette, Home Popular Topics, Library `Open Topic` card actions, collection/tag chips, or Topic results in Universal Search.
## Launch hotfix in 6.5.0-alpha.4

Root cause: 6.5.0-alpha.3 registered the command but launched it through `window.prompt`, then passed empty or unresolved topic names directly to the ItemView. In Obsidian this could leave the command with no visible picker, no selected topic, and no useful Notice.

Correction: `Knowledge Library: Open topic page` now opens a searchable native topic picker. Selecting a topic, pressing Enter, Home Popular Topics, Universal Search Topic rows, Library tag/collection clicks, and Related Topic clicks all route through the same validated `openTopicPage` method. The Topic ItemView stores `topicName` in workspace state so reused or restored leaves keep the selected topic.
