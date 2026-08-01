import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import KnowledgeLibraryPlugin from "../main";
import { DEFAULT_ALLOWED_FILE_EXTENSIONS, DEFAULT_EXCLUDED_FILE_FOLDERS } from "../services/FileResourceService";

export class KnowledgeLibrarySettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: KnowledgeLibraryPlugin
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "KnowledgeLibrary" });

    this.createGroup(containerEl, "Home", "Configure the Knowledge Navigator Home landing view.");

    new Setting(containerEl)
      .setName("Show Continue Learning")
      .setDesc("Show unfinished items with explicit learning signals on Home.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.homeShowContinueLearning)
        .onChange(async (value) => {
          this.plugin.settings.homeShowContinueLearning = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Show Timeline")
      .setDesc("Show the Today, Yesterday, and This Week activity timeline on Home.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.homeShowTimeline)
        .onChange(async (value) => {
          this.plugin.settings.homeShowTimeline = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Show Tag Cloud")
      .setDesc("Show the top tags on Home.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.homeShowTagCloud)
        .onChange(async (value) => {
          this.plugin.settings.homeShowTagCloud = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Default startup page")
      .setDesc("Choose the view opened from the KnowledgeLibrary ribbon icon.")
      .addDropdown((dropdown) => dropdown
        .addOption("home", "Home")
        .addOption("library", "Library")
        .addOption("dashboard", "Dashboard")
        .addOption("universal-search", "Universal Search")
        .setValue(this.plugin.settings.defaultStartupPage)
        .onChange(async (value) => {
          this.plugin.settings.defaultStartupPage = value === "library" || value === "dashboard" || value === "universal-search" ? value : "home";
          await this.plugin.saveSettings();
        }));


    this.createGroup(containerEl, "Topics", "Configure automatically discovered topic pages and topic-oriented navigation.");

    new Setting(containerEl)
      .setName("Enable Topic Pages")
      .setDesc("Allow tags, collections, search results, and cards to open Knowledge Topic pages.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.enableTopicPages)
        .onChange(async (value) => {
          this.plugin.settings.enableTopicPages = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Default Topic Sort")
      .setDesc("Default order for topic lists and the Topic picker.")
      .addDropdown((dropdown) => dropdown
        .addOption("popular", "Popular")
        .addOption("recent", "Recent")
        .addOption("title", "Title")
        .setValue(this.plugin.settings.defaultTopicSort)
        .onChange(async (value) => {
          this.plugin.settings.defaultTopicSort = value === "recent" || value === "title" ? value : "popular";
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Related Topics depth")
      .setDesc("Maximum number of related topics shown on a Topic page.")
      .addText((text) => text.setValue(String(this.plugin.settings.relatedTopicsDepth)).onChange(async (value) => {
        this.plugin.settings.relatedTopicsDepth = boundedNumber(value, 1, 24, 8);
        await this.plugin.saveSettings();
      }));

    new Setting(containerEl)
      .setName("Timeline length")
      .setDesc("Maximum number of chronological topic activity rows.")
      .addText((text) => text.setValue(String(this.plugin.settings.topicTimelineLength)).onChange(async (value) => {
        this.plugin.settings.topicTimelineLength = boundedNumber(value, 5, 100, 20);
        await this.plugin.saveSettings();
      }));
    this.createGroup(containerEl, "Storage", "Choose where KnowledgeLibrary reads library notes and writes resource notes.");

    new Setting(containerEl)
      .setName("Library folder")
      .setDesc("Top-level folder scanned by KnowledgeLibrary.")
      .addText((text) => text
        .setValue(this.plugin.settings.libraryFolder)
        .onChange(async (value) => {
          this.plugin.settings.libraryFolder = value.trim() || "01 - Biblioteca";
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Resources folder")
      .setDesc("Folder where new resource notes are created.")
      .addText((text) => text
        .setValue(this.plugin.settings.resourcesFolder)
        .onChange(async (value) => {
          this.plugin.settings.resourcesFolder = value.trim() || "01 - Biblioteca/Recursos";
          await this.plugin.saveSettings();
        }));

    this.createGroup(containerEl, "Migration and safety", "Control read-only legacy compatibility and safety-related migration behavior.");

    new Setting(containerEl)
      .setName("Include legacy notes")
      .setDesc("Read legacy resource frontmatter fields without modifying files during reads.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.includeLegacyNotes)
        .onChange(async (value) => {
          this.plugin.settings.includeLegacyNotes = value;
          await this.plugin.saveSettings();
        }));

    this.createGroup(containerEl, "Tags", "Configure tag defaults used by resource creation and tag-aware views.");

    new Setting(containerEl)
      .setName("Default tag")
      .setDesc("Default tag reserved for future resource creation workflows.")
      .addText((text) => text
        .setValue(this.plugin.settings.defaultTag)
        .onChange(async (value) => {
          this.plugin.settings.defaultTag = value.trim() || "knowledge-library";
          await this.plugin.saveSettings();
        }));


    this.createGroup(containerEl, "File resources", "Configure which vault files can become first-class KnowledgeLibrary resources.");

    new Setting(containerEl)
      .setName("Allowed file extensions")
      .setDesc("Comma-separated vault file extensions shown in the Add Resource file picker.")
      .addTextArea((text) => text
        .setValue(this.plugin.settings.allowedFileExtensions.join(", "))
        .onChange(async (value) => {
          this.plugin.settings.allowedFileExtensions = parseCsv(value, DEFAULT_ALLOWED_FILE_EXTENSIONS);
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Excluded file folders")
      .setDesc("Comma-separated folder names hidden from the Add Resource file picker.")
      .addTextArea((text) => text
        .setValue(this.plugin.settings.excludedFileFolders.join(", "))
        .onChange(async (value) => {
          this.plugin.settings.excludedFileFolders = parseCsv(value, DEFAULT_EXCLUDED_FILE_FOLDERS);
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Show file size on cards")
      .setDesc("Display stored local file sizes in library cards.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.showFileSizeOnCards)
        .onChange(async (value) => {
          this.plugin.settings.showFileSizeOnCards = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Enable drag and drop")
      .setDesc("Allow vault files to be dropped onto the library view to prefill Add Resource.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.enableDragAndDrop)
        .onChange(async (value) => {
          this.plugin.settings.enableDragAndDrop = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Unknown file type")
      .setDesc("Default resource type for allowed files whose extension is unknown.")
      .addDropdown((dropdown) => dropdown
        .addOption("other", "Other")
        .addOption("document", "Document")
        .addOption("archive", "Archive")
        .addOption("script", "Script")
        .setValue(this.plugin.settings.defaultUnknownFileType)
        .onChange(async (value) => {
          this.plugin.settings.defaultUnknownFileType = value === "document" || value === "archive" || value === "script" ? value : "other";
          await this.plugin.saveSettings();
        }));

    this.createGroup(containerEl, "Vault connectors", "Configure read-only external vault connectors for the unified knowledge index. Removing a connector only removes configuration.");

    new Setting(containerEl)
      .setName("Manage vault connectors")
      .setDesc("Add, edit, enable, disable, test, and remove connector configurations without modifying external vaults.")
      .addButton((button) => button
        .setButtonText("Manage")
        .onClick(() => this.plugin.openVaultConnectorsManager()));

    new Setting(containerEl)
      .setName("Test vault connectors")
      .setDesc("Checks configured connector paths and reports missing, offline, or inaccessible folders.")
      .addButton((button) => button
        .setButtonText("Test")
        .onClick(async () => {
          const index = await this.plugin.unifiedIndexService.rebuild();
          const available = index.connector_statuses.filter((status) => status.available).length;
          new Notice(`${available}/${index.connector_statuses.length} connectors available.`);
        }));

    new Setting(containerEl)
      .setName("Connector JSON")
      .setDesc("Advanced connector configuration. External vault content remains read-only.")
      .addTextArea((text) => text
        .setValue(JSON.stringify(this.plugin.settings.vaultConnectors, null, 2))
        .onChange(async (value) => {
          try {
            const parsed = JSON.parse(value) as unknown;
            if (Array.isArray(parsed)) {
              this.plugin.settings.vaultConnectors = parsed as typeof this.plugin.settings.vaultConnectors;
              await this.plugin.saveSettings();
            }
          } catch {
            // Keep invalid partial JSON in the control without saving it.
          }
        }));
    this.createGroup(containerEl, "Search", "Tune universal search responsiveness, ranking, display, excerpts, and saved searches.");

    new Setting(containerEl)
      .setName("Default search display")
      .setDesc("Initial Universal Search result layout.")
      .addDropdown((dropdown) => dropdown
        .addOption("compact", "Compact")
        .addOption("comfortable", "Comfortable")
        .addOption("grouped-role", "Grouped by role")
        .addOption("grouped-vault", "Grouped by vault")
        .addOption("grouped-source", "Grouped by source")
        .setValue(this.plugin.settings.defaultSearchDisplayMode)
        .onChange(async (value) => {
          this.plugin.settings.defaultSearchDisplayMode = value as typeof this.plugin.settings.defaultSearchDisplayMode;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Search result limit")
      .setDesc("Maximum number of results shown in Universal Search.")
      .addText((text) => text.setValue(String(this.plugin.settings.searchResultLimit)).onChange(async (value) => {
        this.plugin.settings.searchResultLimit = boundedNumber(value, 10, 1000, 100);
        await this.plugin.saveSettings();
      }));

    new Setting(containerEl)
      .setName("Search debounce delay")
      .setDesc("Milliseconds to wait after typing before searching.")
      .addText((text) => text.setValue(String(this.plugin.settings.searchDebounceMs)).onChange(async (value) => {
        this.plugin.settings.searchDebounceMs = boundedNumber(value, 0, 1000, 150);
        await this.plugin.saveSettings();
      }));

    new Setting(containerEl)
      .setName("Ranking boosts")
      .setDesc("Comma-separated boosts for active vault, favorites, and recent items.")
      .addText((text) => text.setValue([this.plugin.settings.searchActiveVaultBoost, this.plugin.settings.searchFavoriteBoost, this.plugin.settings.searchRecentBoost].join(", ")).onChange(async (value) => {
        const [active, favorite, recent] = parseCsv(value, ["80", "60", "40"]).map((item) => boundedNumber(item, 0, 500, 0));
        this.plugin.settings.searchActiveVaultBoost = active;
        this.plugin.settings.searchFavoriteBoost = favorite;
        this.plugin.settings.searchRecentBoost = recent;
        await this.plugin.saveSettings();
      }));

    new Setting(containerEl)
      .setName("Duplicate suppression")
      .setDesc("Hide search-time duplicates that point to the same resource, video, URL, or file path.")
      .addToggle((toggle) => toggle.setValue(this.plugin.settings.searchDuplicateSuppression).onChange(async (value) => {
        this.plugin.settings.searchDuplicateSuppression = value;
        await this.plugin.saveSettings();
      }));

    new Setting(containerEl)
      .setName("Show excerpts")
      .setDesc("Show indexed excerpts in Universal Search results.")
      .addToggle((toggle) => toggle.setValue(this.plugin.settings.searchShowExcerpts).onChange(async (value) => {
        this.plugin.settings.searchShowExcerpts = value;
        await this.plugin.saveSettings();
      }));

    new Setting(containerEl)
      .setName("Excerpt length")
      .setDesc("Maximum characters shown from indexed excerpts.")
      .addText((text) => text.setValue(String(this.plugin.settings.searchExcerptLength)).onChange(async (value) => {
        this.plugin.settings.searchExcerptLength = boundedNumber(value, 40, 1000, 260);
        await this.plugin.saveSettings();
      }));

    new Setting(containerEl)
      .setName("Default grouping")
      .setDesc("Preferred grouping mode for future search surfaces.")
      .addDropdown((dropdown) => dropdown
        .addOption("compact", "None")
        .addOption("grouped-role", "Role")
        .addOption("grouped-vault", "Vault")
        .addOption("grouped-source", "Source")
        .setValue(this.plugin.settings.searchDefaultGrouping)
        .onChange(async (value) => {
          this.plugin.settings.searchDefaultGrouping = value as typeof this.plugin.settings.searchDefaultGrouping;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Saved searches")
      .setDesc("Allow saved Universal Search queries in plugin data.")
      .addToggle((toggle) => toggle.setValue(this.plugin.settings.searchEnableSavedSearches).onChange(async (value) => {
        this.plugin.settings.searchEnableSavedSearches = value;
        await this.plugin.saveSettings();
      }));
    this.createGroup(containerEl, "Display", "Adjust visual density and card details in the library view.");

    new Setting(containerEl)
      .setName("Display card density")
      .setDesc("Controls spacing in the library card grid.")
      .addDropdown((dropdown) => dropdown
        .addOption("comfortable", "Comfortable")
        .addOption("compact", "Compact")
        .setValue(this.plugin.settings.displayCardDensity)
        .onChange(async (value) => {
          this.plugin.settings.displayCardDensity = value === "compact" ? "compact" : "comfortable";
          await this.plugin.saveSettings();
        }));
  }

  private createGroup(parent: HTMLElement, title: string, description: string): void {
    const group = parent.createDiv({ cls: "knowledge-library-settings-group" });
    group.createEl("h3", { text: title });
    group.createEl("p", { text: description });
  }
}

function parseCsv(value: string, fallback: string[]): string[] {
  const values = value.split(",").map((item) => item.trim().replace(/^\./, "").toLowerCase()).filter(Boolean);
  return values.length > 0 ? Array.from(new Set(values)) : fallback;
}
function boundedNumber(value: string, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}
