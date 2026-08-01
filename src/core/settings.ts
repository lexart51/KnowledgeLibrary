import { DEFAULT_ALLOWED_FILE_EXTENSIONS, DEFAULT_EXCLUDED_FILE_FOLDERS } from "../services/FileResourceService";
import { KnowledgeResourceType } from "../models/KnowledgeResource";

export interface KnowledgeLibraryPluginSettings {
  versionLabel: string;
  libraryFolder: string;
  resourcesFolder: string;
  includeLegacyNotes: boolean;
  defaultTag: string;
  displayCardDensity: "comfortable" | "compact";
  allowedFileExtensions: string[];
  excludedFileFolders: string[];
  showFileSizeOnCards: boolean;
  enableDragAndDrop: boolean;
  defaultUnknownFileType: KnowledgeResourceType;
}

export const DEFAULT_SETTINGS: KnowledgeLibraryPluginSettings = {
  versionLabel: "KL 6.0.0-rc.1",
  libraryFolder: "01 - Biblioteca",
  resourcesFolder: "01 - Biblioteca/Recursos",
  includeLegacyNotes: true,
  defaultTag: "knowledge-library",
  displayCardDensity: "comfortable",
  allowedFileExtensions: DEFAULT_ALLOWED_FILE_EXTENSIONS,
  excludedFileFolders: DEFAULT_EXCLUDED_FILE_FOLDERS,
  showFileSizeOnCards: true,
  enableDragAndDrop: true,
  defaultUnknownFileType: "other"
};
