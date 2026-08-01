import { App, TFile } from "obsidian";
import { KnowledgeLibraryPluginSettings } from "../core/settings";
import { KnowledgeResource, KnowledgeResourceType, ResourceInput } from "../models/KnowledgeResource";
import { parseYouTubeUrl } from "../providers/YouTubeProvider";
import { normalizeWebsiteUrl } from "../providers/WebsiteProvider";
import { TagService } from "./TagService";
import { ResourceService } from "./ResourceService";
import { StoredResource, VaultResourceRepository } from "./VaultResourceRepository";

export type AddResourceKind = "youtube" | "website" | "pdf" | "book" | "powerpoint" | "markdown" | "image" | "script" | "skill" | "archive" | "other";

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
    private readonly tagService = new TagService()
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
    const metadata = {
      edition: request.edition?.trim() || undefined,
      publisher: request.publisher?.trim() || undefined,
      isbn: request.isbn?.trim() || undefined
    };

    if (request.kind === "youtube" || request.kind === "website" || (request.kind === "book" && request.url)) {
      return {
        type: request.kind === "book" ? "book" : request.kind,
        url: required(request.url, "URL is required."),
        title: request.title?.trim() || undefined,
        creator: request.creator?.trim() || undefined,
        tags,
        metadata
      };
    }

    return {
      type: mapKindToType(request.kind),
      filePath: required(request.filePath, "Vault file is required."),
      title: request.title?.trim() || undefined,
      creator: request.creator?.trim() || undefined,
      tags,
      metadata: {
        ...metadata,
        vaultFile: this.getFileMetadata(required(request.filePath, "Vault file is required."))
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
      return (await this.repository.list()).find((item) => item.resource.filePath === input.filePath) ?? null;
    }

    return null;
  }

  private getFileMetadata(path: string): Record<string, unknown> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      return {
        basename: file.basename,
        extension: file.extension,
        path: file.path,
        size: file.stat.size,
        modifiedTime: file.stat.mtime,
        createdTime: file.stat.ctime
      };
    }

    return { path };
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
