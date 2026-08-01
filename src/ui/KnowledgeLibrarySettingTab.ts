import { App, PluginSettingTab, Setting } from "obsidian";
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
