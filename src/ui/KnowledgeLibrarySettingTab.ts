import { App, PluginSettingTab, Setting } from "obsidian";
import KnowledgeLibraryPlugin from "../main";

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

    new Setting(containerEl)
      .setName("Include legacy notes")
      .setDesc("Read legacy resource frontmatter fields without modifying files during reads.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.includeLegacyNotes)
        .onChange(async (value) => {
          this.plugin.settings.includeLegacyNotes = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Default tag")
      .setDesc("Default tag reserved for future resource creation workflows.")
      .addText((text) => text
        .setValue(this.plugin.settings.defaultTag)
        .onChange(async (value) => {
          this.plugin.settings.defaultTag = value.trim() || "knowledge-library";
          await this.plugin.saveSettings();
        }));

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
}
