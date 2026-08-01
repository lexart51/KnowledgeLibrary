import { normalizePath, TFile } from "obsidian";
import type { KnowledgeLibraryPluginSettings } from "../core/settings";
import { KnowledgeResource, KnowledgeResourceType } from "../models/KnowledgeResource";
import { createResourceId } from "../utils/ids";

export interface FileTypeInfo {
  type: KnowledgeResourceType;
  mimeType: string | null;
  scriptLanguage: string | null;
  archiveFormat: string | null;
  documentFormat: string | null;
}

export interface VaultFileMetadata {
  filename: string;
  extension: string | null;
  fileSizeBytes: number | null;
  createdTime: number | null;
  modifiedTime: number | null;
  vaultRelativePath: string;
  parentFolder: string;
  mimeType: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  scriptLanguage: string | null;
  archiveFormat: string | null;
  documentFormat: string | null;
}

type FileStat = { size?: number; ctime?: number; mtime?: number };

const IMAGE_EXTENSIONS = new Set(["avif", "bmp", "gif", "ico", "jpeg", "jpg", "png", "svg", "tif", "tiff", "webp"]);
const SCRIPT_LANGUAGES = new Map<string, string>([
  ["bat", "Batch"],
  ["c", "C"],
  ["cpp", "C++"],
  ["cs", "C#"],
  ["css", "CSS"],
  ["go", "Go"],
  ["html", "HTML"],
  ["java", "Java"],
  ["js", "JavaScript"],
  ["json", "JSON"],
  ["jsx", "JavaScript JSX"],
  ["lua", "Lua"],
  ["php", "PHP"],
  ["ps1", "PowerShell"],
  ["py", "Python"],
  ["r", "R"],
  ["rb", "Ruby"],
  ["rs", "Rust"],
  ["scss", "SCSS"],
  ["sh", "Shell"],
  ["sql", "SQL"],
  ["swift", "Swift"],
  ["ts", "TypeScript"],
  ["tsx", "TypeScript TSX"],
  ["xml", "XML"],
  ["yaml", "YAML"],
  ["yml", "YAML"]
]);
const ARCHIVE_FORMATS = new Map<string, string>([
  ["7z", "7z"],
  ["bz2", "BZip2"],
  ["gz", "GZip"],
  ["rar", "RAR"],
  ["tar", "TAR"],
  ["tgz", "TAR.GZ"],
  ["xz", "XZ"],
  ["zip", "ZIP"]
]);
const DOCUMENT_FORMATS = new Map<string, string>([
  ["doc", "Word"],
  ["docx", "Word"],
  ["pdf", "PDF"],
  ["ppt", "PowerPoint"],
  ["pptx", "PowerPoint"],
  ["txt", "Text"]
]);
const MIME_TYPES = new Map<string, string>([
  ["7z", "application/x-7z-compressed"],
  ["avif", "image/avif"],
  ["bmp", "image/bmp"],
  ["doc", "application/msword"],
  ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ["epub", "application/epub+zip"],
  ["gif", "image/gif"],
  ["gz", "application/gzip"],
  ["jpeg", "image/jpeg"],
  ["jpg", "image/jpeg"],
  ["js", "text/javascript"],
  ["json", "application/json"],
  ["md", "text/markdown"],
  ["pdf", "application/pdf"],
  ["png", "image/png"],
  ["ppt", "application/vnd.ms-powerpoint"],
  ["pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  ["py", "text/x-python"],
  ["rar", "application/vnd.rar"],
  ["svg", "image/svg+xml"],
  ["tar", "application/x-tar"],
  ["ts", "text/typescript"],
  ["txt", "text/plain"],
  ["webp", "image/webp"],
  ["zip", "application/zip"]
]);

export const DEFAULT_ALLOWED_FILE_EXTENSIONS = [
  "*", "pdf", "ppt", "pptx", "doc", "docx", "epub", "md", "markdown", "txt",
  "png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif", "tif", "tiff",
  "js", "ts", "tsx", "jsx", "py", "rb", "ps1", "sh", "bat", "css", "html", "json", "yaml", "yml", "xml", "sql", "go", "rs", "java", "c", "cpp", "cs", "php", "lua", "r", "swift",
  "zip", "7z", "rar", "tar", "gz", "tgz", "bz2", "xz"
];

export const DEFAULT_EXCLUDED_FILE_FOLDERS = [".obsidian", "backups", "backup", "quarantine", "reports", "templates"];

export class FileResourceService {
  static normalizeVaultPath(path: string): string {
    return normalizePath(path.trim()).replace(/^\/+/, "");
  }

  static extensionFromPath(path: string): string | null {
    const name = this.filenameFromPath(path);
    const dotIndex = name.lastIndexOf(".");
    return dotIndex > -1 ? name.slice(dotIndex + 1).toLowerCase() : null;
  }

  static filenameFromPath(path: string): string {
    return this.normalizeVaultPath(path).split("/").filter(Boolean).pop() ?? path;
  }

  static parentFolderFromPath(path: string): string {
    const parts = this.normalizeVaultPath(path).split("/").filter(Boolean);
    parts.pop();
    return parts.join("/");
  }

  static detectType(path: string, requestedType?: KnowledgeResourceType, defaultUnknown: KnowledgeResourceType = "other"): KnowledgeResourceType {
    if (requestedType && requestedType !== "file") {
      return requestedType;
    }

    const extension = this.extensionFromPath(path);
    if (!extension) {
      return defaultUnknown;
    }

    if (extension === "pdf") {
      return "pdf";
    }
    if (extension === "ppt" || extension === "pptx") {
      return "powerpoint";
    }
    if (extension === "doc" || extension === "docx" || extension === "txt") {
      return "document";
    }
    if (extension === "epub") {
      return "book";
    }
    if (extension === "md" || extension === "markdown") {
      return "markdown";
    }
    if (IMAGE_EXTENSIONS.has(extension)) {
      return "image";
    }
    if (SCRIPT_LANGUAGES.has(extension)) {
      return "script";
    }
    if (ARCHIVE_FORMATS.has(extension)) {
      return "archive";
    }

    return defaultUnknown;
  }

  static typeInfo(path: string, requestedType?: KnowledgeResourceType, defaultUnknown: KnowledgeResourceType = "other"): FileTypeInfo {
    const extension = this.extensionFromPath(path);
    return {
      type: this.detectType(path, requestedType, defaultUnknown),
      mimeType: extension ? MIME_TYPES.get(extension) ?? null : null,
      scriptLanguage: extension ? SCRIPT_LANGUAGES.get(extension) ?? null : null,
      archiveFormat: extension ? ARCHIVE_FORMATS.get(extension) ?? null : null,
      documentFormat: extension ? DOCUMENT_FORMATS.get(extension) ?? (extension === "epub" ? "EPUB" : null) : null
    };
  }

  static deterministicResourceId(path: string): string {
    return createResourceId(`file:${this.normalizeVaultPath(path).toLowerCase()}`);
  }

  static isAllowedFile(file: TFile, settings: KnowledgeLibraryPluginSettings, search = ""): boolean {
    const path = this.normalizeVaultPath(file.path);
    const lowerPath = path.toLowerCase();
    const excludedFolders = new Set([...(settings.excludedFileFolders ?? DEFAULT_EXCLUDED_FILE_FOLDERS)].map((folder) => folder.toLowerCase()));
    const resourceFolder = this.normalizeVaultPath(settings.resourcesFolder).toLowerCase();
    const extension = this.extensionFromPath(path);
    const allowedExtensions = new Set((settings.allowedFileExtensions ?? DEFAULT_ALLOWED_FILE_EXTENSIONS).map((item) => item.toLowerCase().replace(/^\./, "")));
    const segments = lowerPath.split("/");

    if (lowerPath === resourceFolder || lowerPath.startsWith(`${resourceFolder}/`)) {
      return false;
    }

    if (segments.some((segment) => segment.startsWith(".") || excludedFolders.has(segment))) {
      return false;
    }

    if (allowedExtensions.size > 0 && !allowedExtensions.has("*") && (!extension || !allowedExtensions.has(extension))) {
      return false;
    }

    const query = search.trim().toLowerCase();
    return !query || lowerPath.includes(query);
  }

  static filterVaultFiles(files: TFile[], settings: KnowledgeLibraryPluginSettings, search = ""): TFile[] {
    return files.filter((file) => this.isAllowedFile(file, settings, search)).sort((left, right) => left.path.localeCompare(right.path));
  }

  static metadataFromFile(file: TFile, typeInfo = this.typeInfo(file.path)): VaultFileMetadata {
    const path = this.normalizeVaultPath(file.path);
    const stat = (file as unknown as { stat?: FileStat }).stat ?? {};
    return {
      filename: this.filenameFromPath(path),
      extension: this.extensionFromPath(path),
      fileSizeBytes: typeof stat.size === "number" ? stat.size : null,
      createdTime: typeof stat.ctime === "number" ? stat.ctime : null,
      modifiedTime: typeof stat.mtime === "number" ? stat.mtime : null,
      vaultRelativePath: path,
      parentFolder: this.parentFolderFromPath(path),
      mimeType: typeInfo.mimeType,
      imageWidth: null,
      imageHeight: null,
      scriptLanguage: typeInfo.scriptLanguage,
      archiveFormat: typeInfo.archiveFormat,
      documentFormat: typeInfo.documentFormat
    };
  }

  static isProbablyMovedFile(resource: KnowledgeResource, file: TFile): boolean {
    const metadata = resource.metadata;
    const candidate = this.metadataFromFile(file);
    return Boolean(
      resource.filePath &&
      metadata.filename === candidate.filename &&
      metadata.fileSizeBytes === candidate.fileSizeBytes &&
      metadata.modifiedTime === candidate.modifiedTime
    );
  }
}

export function formatFileSize(bytes: unknown): string | null {
  if (typeof bytes !== "number" || !Number.isFinite(bytes)) {
    return null;
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  for (const unit of units) {
    if (value < 1024 || unit === "TB") {
      return `${value.toFixed(value < 10 ? 1 : 0)} ${unit}`;
    }
    value /= 1024;
  }

  return null;
}
