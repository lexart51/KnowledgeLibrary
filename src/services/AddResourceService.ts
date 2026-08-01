import { App, TFile } from "obsidian";
import { KnowledgeLibraryPluginSettings } from "../core/settings";
import { KnowledgeResource, KnowledgeResourcePriority, KnowledgeResourceProgressUnit, KnowledgeResourceType, ResourceInput } from "../models/KnowledgeResource";
import { parseYouTubeUrl } from "../providers/YouTubeProvider";
import { normalizeWebsiteUrl } from "../providers/WebsiteProvider";
import { FileResourceService } from "./FileResourceService";
import { TagService } from "./TagService";
import { ResourceService } from "./ResourceService";
import { CollectionService } from "./CollectionService";
import { ProgressService } from "./ProgressService";
import { StoredResource, VaultResourceRepository } from "./VaultResourceRepository";

export type AddResourceKind = "youtube" | "website" | "pdf" | "book" | "powerpoint" | "document" | "markdown" | "image" | "script" | "skill" | "archive" | "other";

export interface AddResourceRequest {
  kind: AddResourceKind;
  url?: string;
  filePath?: string;
  title?: string;
  creator?: string;
  tags?: string[];
  edition?: string;
  publisher?: string;
  isbn?: string;
  notes?: string;
  category?: string;
  presentationDate?: string;
  documentDate?: string;
  sourceProject?: string;
  description?: string;
  language?: string;
  project?: string;
  entryPoint?: string;
  platform?: string;
  version?: string;
  archiveFormat?: string;
  resourceSubtype?: string;
  collections?: string[];
  progress?: number;
  progress_unit?: KnowledgeResourceProgressUnit;
  current_position?: number | null;
  total_units?: number | null;
  priority?: KnowledgeResourcePriority;
  completed?: boolean;
}

export interface AddResourceResult {
  resource: KnowledgeResource;
  stored: StoredResource;
  duplicate: boolean;
}

export class AddResourceService {
  constructor(
    private readonly app: App,
    private readonly settings: KnowledgeLibraryPluginSettings,
    private readonly resourceService: ResourceService,
    private readonly repository: VaultResourceRepository,
    private readonly tagService = new TagService(),
    private readonly collectionService = new CollectionService(),
    private readonly progressService = new ProgressService()
  ) {}

  async addResource(request: AddResourceRequest): Promise<AddResourceResult> {
    const input = this.toResourceInput(request);
    const duplicate = await this.findDuplicate(request, input);
    if (duplicate) {
      return { resource: duplicate.resource, stored: duplicate, duplicate: true };
    }

    const resource = await this.resourceService.createResource(input);
    const stored = await this.repository.create(resource);
    return { resource: stored.resource, stored, duplicate: false };
  }

  getCanonicalTags(rawTags: string[] = []): string[] {
    return this.tagService.normalizeTags([this.settings.defaultTag, ...rawTags]);
  }

  getExistingCanonicalTags(): string[] {
    return this.tagService.normalizeTags(
      this.app.vault.getMarkdownFiles().flatMap((file) => {
        const cache = this.app.metadataCache.getFileCache(file);
        const tags = cache?.frontmatter?.tags;
        return Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === "string") : [];
      })
    ).sort();
  }

  private toResourceInput(request: AddResourceRequest): ResourceInput {
    const tags = this.getCanonicalTags(parseTagInput(request.tags ?? []));
    const progress = this.progressService.normalize({
      completed: request.completed,
      progress: request.progress,
      progress_unit: request.progress_unit,
      current_position: request.current_position,
      total_units: request.total_units
    });
    const metadata = compactMetadata({
      edition: request.edition,
      publisher: request.publisher,
      isbn: request.isbn,
      notes: request.notes,
      category: request.category,
      presentationDate: request.presentationDate,
      documentDate: request.documentDate,
      sourceProject: request.sourceProject,
      description: request.description,
      language: request.language,
      project: request.project,
      entryPoint: request.entryPoint,
      platform: request.platform,
      version: request.version,
      archiveFormat: request.archiveFormat,
      resourceSubtype: request.resourceSubtype
    });

    if (request.kind === "youtube" || request.kind === "website" || (request.kind === "book" && request.url)) {
      return {
        type: request.kind === "book" ? "book" : request.kind,
        url: required(request.url, "URL is required."),
        title: request.title?.trim() || undefined,
        creator: request.creator?.trim() || undefined,
        tags,
        collections: this.collectionService.normalizeCollections(parseTagInput(request.collections ?? [])),
        completed: progress.completed,
        progress: progress.progress,
        progress_unit: progress.progress_unit,
        current_position: progress.current_position,
        total_units: progress.total_units,
        priority: request.priority ?? "normal",
        metadata
      };
    }

    return {
      type: mapKindToType(request.kind),
      filePath: required(request.filePath, "Vault file is required."),
      title: request.title?.trim() || undefined,
      creator: request.creator?.trim() || undefined,
      tags,
      collections: this.collectionService.normalizeCollections(parseTagInput(request.collections ?? [])),
      completed: progress.completed,
      progress: progress.progress,
      progress_unit: progress.progress_unit,
      current_position: progress.current_position,
      total_units: progress.total_units,
      priority: request.priority ?? "normal",
      metadata: {
        ...metadata,
        ...this.getFileMetadata(required(request.filePath, "Vault file is required."))
      }
    };
  }

  private async findDuplicate(request: AddResourceRequest, input: ResourceInput): Promise<StoredResource | null> {
    if (request.kind === "youtube") {
      const videoId = parseYouTubeUrl(required(input.url, "URL is required."))?.videoId;
      return videoId ? this.repository.findYouTubeByVideoId(videoId) : null;
    }

    if ((request.kind === "website" || request.kind === "book") && input.url) {
      const canonicalUrl = normalizeWebsiteUrl(new URL(input.url));
      return (await this.repository.list()).find((item) => item.resource.url === canonicalUrl) ?? null;
    }

    if (input.filePath) {
      const normalizedPath = FileResourceService.normalizeVaultPath(input.filePath);
      const activeFile = this.app.vault.getAbstractFileByPath(normalizedPath);
      const resources = await this.repository.list();
      return resources.find((item) => item.resource.filePath === normalizedPath)
        ?? (activeFile instanceof TFile ? resources.find((item) => FileResourceService.isProbablyMovedFile(item.resource, activeFile)) ?? null : null);
    }

    return null;
  }

  private getFileMetadata(path: string): Record<string, unknown> {
    const normalizedPath = FileResourceService.normalizeVaultPath(path);
    const file = this.app.vault.getAbstractFileByPath(normalizedPath);
    const typeInfo = FileResourceService.typeInfo(normalizedPath);

    if (file instanceof TFile) {
      return { ...FileResourceService.metadataFromFile(file, typeInfo) };
    }

    return {
      filename: FileResourceService.filenameFromPath(normalizedPath),
      extension: FileResourceService.extensionFromPath(normalizedPath),
      vaultRelativePath: normalizedPath,
      parentFolder: FileResourceService.parentFolderFromPath(normalizedPath),
      mimeType: typeInfo.mimeType,
      scriptLanguage: typeInfo.scriptLanguage,
      archiveFormat: typeInfo.archiveFormat,
      documentFormat: typeInfo.documentFormat
    };
  }
}

function parseTagInput(tags: string[]): string[] {
  return tags.flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
}

function required(value: string | undefined | null, message: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(message);
  }
  return trimmed;
}

function mapKindToType(kind: AddResourceKind): KnowledgeResourceType {
  return kind === "archive" ? "archive" : kind;
}

function compactMetadata(values: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values)
      .map(([key, value]) => [key, value?.trim()] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[1]))
  );
}
