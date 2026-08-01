# Topic Pages

KnowledgeLibrary 6.5.0-alpha.3 adds `Knowledge Topic` pages as a topic-oriented navigation surface over the existing active-vault resources and unified index.

A Topic Page is read-only. It does not create, move, rename, delete, or rewrite vault content. It groups existing resources, conversations, documents, collections, timeline activity, related topics, and topic-scoped Continue Learning into one view.

Open a Topic Page from the command palette, Home Popular Topics, Library `Open Topic` card actions, collection/tag chips, or Topic results in Universal Search.
## Launch hotfix in 6.5.0-alpha.4

Root cause: 6.5.0-alpha.3 registered the command but launched it through `window.prompt`, then passed empty or unresolved topic names directly to the ItemView. In Obsidian this could leave the command with no visible picker, no selected topic, and no useful Notice.

Correction: `Knowledge Library: Open topic page` now opens a searchable native topic picker. Selecting a topic, pressing Enter, Home Popular Topics, Universal Search Topic rows, Library tag/collection clicks, and Related Topic clicks all route through the same validated `openTopicPage` method. The Topic ItemView stores `topicName` in workspace state so reused or restored leaves keep the selected topic.
## Runtime launch hotfix in 6.5.0-alpha.5

Root cause: 6.5.0-alpha.4 still relied on a modal-only topic picker path. If Obsidian did not visibly render the modal or the modal did not reach `onOpen`, users had no persistent in-workspace topic list and the command appeared to do nothing.

Correction: topic navigation now has two paths. The quick picker remains available and logs DEBUG diagnostics through `LoggerService`, including command invocation, topic discovery, topic count, picker construction, picker open, picker `onOpen`, topic selection, and Topic Page leaf activation. If picker `onOpen` is not observed, KnowledgeLibrary shows a Notice and opens the `Knowledge Library: Topics` ItemView fallback.

The `Knowledge Library: Topics` view lists discovered topics, filters them by name or alias, shows logical item counts and represented source types, and opens the same `Knowledge Topic` ItemView by click or Enter. The `Knowledge Library: Test Topic Navigation` command reports topic discovery, picker availability, Topic ItemView registration, navigation shell registration, and unified index availability.
