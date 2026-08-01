import { DEFAULT_ALLOWED_FILE_EXTENSIONS, DEFAULT_EXCLUDED_FILE_FOLDERS } from "../services/FileResourceService";
import { KnowledgeResourceType } from "../models/KnowledgeResource";
import { VaultConnector } from "../models/VaultConnector";
import { UniversalSearchDisplayMode } from "../services/SearchRankingService";
import { TopicSortMode } from "../services/TopicService";

export interface KnowledgeLibraryPluginSettings {
  versionLabel: string;
  homeShowContinueLearning: boolean;
  homeShowTimeline: boolean;
  homeShowTagCloud: boolean;
  enableTopicPages: boolean;
  defaultTopicSort: TopicSortMode;
  relatedTopicsDepth: number;
  topicTimelineLength: number;
  defaultStartupPage: "home" | "library" | "dashboard" | "universal-search";
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
  vaultConnectors: VaultConnector[];
  defaultSearchDisplayMode: UniversalSearchDisplayMode;
  searchResultLimit: number;
  searchDebounceMs: number;
  searchActiveVaultBoost: number;
  searchFavoriteBoost: number;
  searchRecentBoost: number;
  searchDuplicateSuppression: boolean;
  searchShowExcerpts: boolean;
  searchExcerptLength: number;
  searchDefaultGrouping: UniversalSearchDisplayMode;
  searchEnableSavedSearches: boolean;
  logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR";
}

export const DEFAULT_VAULT_CONNECTORS: VaultConnector[] = [
  {
    id: "youtube-resources",
    displayName: "YouTubes",
    role: "resources",
    windowsPath: "D:/Dropbox/Cursos Livros Instrucoes/YouTubes",
    linuxPath: "",
    vaultName: "YouTubes",
    enabled: false,
    includePatterns: ["**/*.md"],
    excludePatterns: [],
    preferredNoteType: "resource",
    icon: "library",
    colorToken: "var(--interactive-accent)",
    defaultCollections: ["Knowledge Resources"],
    enableDefaultCollections: false,
    lastScanAt: null,
    lastError: null
  },
  {
    id: "conversation-archive",
    displayName: "Obsidian_Vault",
    role: "conversations",
    windowsPath: "D:/Dropbox/Obsidian_Vault",
    linuxPath: "",
    vaultName: "Obsidian_Vault",
    enabled: false,
    includePatterns: ["**/*.md"],
    excludePatterns: [],
    preferredNoteType: "conversation",
    icon: "messages-square",
    colorToken: "var(--text-accent)",
    defaultCollections: ["Conversation Archive"],
    enableDefaultCollections: false,
    lastScanAt: null,
    lastError: null
  },
  {
    id: "document-archive",
    displayName: "_Docs",
    role: "documents",
    windowsPath: "D:/Dropbox/_Docs",
    linuxPath: "",
    vaultName: "_Docs",
    enabled: false,
    includePatterns: ["**/*.md", "**/*.pdf", "**/*.docx", "**/*.pptx", "**/*.txt"],
    excludePatterns: [],
    preferredNoteType: "document",
    icon: "files",
    colorToken: "var(--text-muted)",
    defaultCollections: ["Document Archive"],
    enableDefaultCollections: false,
    lastScanAt: null,
    lastError: null
  }
];
export const DEFAULT_SETTINGS: KnowledgeLibraryPluginSettings = {
  versionLabel: "KL 6.5.0-alpha.3",
  homeShowContinueLearning: true,
  homeShowTimeline: true,
  homeShowTagCloud: true,
  enableTopicPages: true,
  defaultTopicSort: "popular",
  relatedTopicsDepth: 8,
  topicTimelineLength: 20,
  defaultStartupPage: "home",
  libraryFolder: "01 - Biblioteca",
  resourcesFolder: "01 - Biblioteca/Recursos",
  includeLegacyNotes: true,
  defaultTag: "knowledge-library",
  displayCardDensity: "comfortable",
  allowedFileExtensions: DEFAULT_ALLOWED_FILE_EXTENSIONS,
  excludedFileFolders: DEFAULT_EXCLUDED_FILE_FOLDERS,
  showFileSizeOnCards: true,
  enableDragAndDrop: true,
  defaultUnknownFileType: "other",
  vaultConnectors: DEFAULT_VAULT_CONNECTORS,
  defaultSearchDisplayMode: "compact",
  searchResultLimit: 100,
  searchDebounceMs: 150,
  searchActiveVaultBoost: 80,
  searchFavoriteBoost: 60,
  searchRecentBoost: 40,
  searchDuplicateSuppression: true,
  searchShowExcerpts: true,
  searchExcerptLength: 260,
  searchDefaultGrouping: "compact",
  searchEnableSavedSearches: true,
  logLevel: "WARN"
};
