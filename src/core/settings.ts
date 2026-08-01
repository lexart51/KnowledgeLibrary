export interface KnowledgeLibraryPluginSettings {
  versionLabel: string;
  libraryFolder: string;
  resourcesFolder: string;
  includeLegacyNotes: boolean;
  defaultTag: string;
  displayCardDensity: "comfortable" | "compact";
}

export const DEFAULT_SETTINGS: KnowledgeLibraryPluginSettings = {
  versionLabel: "KL 6.0.0-beta.1",
  libraryFolder: "01 - Biblioteca",
  resourcesFolder: "01 - Biblioteca/Recursos",
  includeLegacyNotes: true,
  defaultTag: "knowledge-library",
  displayCardDensity: "comfortable"
};
