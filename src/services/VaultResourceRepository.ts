import { App, normalizePath, TFile } from "obsidian";
import { KnowledgeLibraryPluginSettings } from "../core/settings";
import { KnowledgeResource } from "../models/KnowledgeResource";
import { parseYouTubeUrl } from "../providers/YouTubeProvider";
import { FileResourceService } from "./FileResourceService";
import { ResourceDeserializer } from "./ResourceDeserializer";
import { ResourceSerializer } from "./ResourceSerializer";
import { TagService } from "./TagService";

export interface StoredResource {
  resource: KnowledgeResource;
  path: string;
  legacy: boolean;
}

const EXCLUDED_SEGMENTS = new Set([".obsidian", "backups", "backup", "quarantine", "reports", "templates"]);

export function isExcludedResourcePath(path: string): boolean {
  return normalizePath(path)
    .split("/")
    .some((segment) => segment.startsWith(".") || EXCLUDED_SEGMENTS.has(segment.toLowerCase()));
}

export function getProviderResourceKey(resource: KnowledgeResource): string {
  if (resource.type === "youtube") {
    const videoId = typeof resource.metadata.videoId === "string" ? resource.metadata.videoId : resource.url ? parseYouTubeUrl(resource.url)?.videoId : null;
    return `youtube:${videoId ?? resource.id}`;
  }

  if (resource.filePath) {
    return `file:${FileResourceService.normalizeVaultPath(resource.filePath).toLowerCase()}`;
  }

  return `${resource.type}:${resource.url ?? resource.id}`;
}

export function deduplicateStoredResources(resources: StoredResource[]): StoredResource[] {
  const byKey = new Map<string, StoredResource>();

  for (const item of resources) {
    const key = getProviderResourceKey(item.resource);
    const existing = byKey.get(key);

    if (!existing || item.resource.updatedAt > existing.resource.updatedAt) {
      byKey.set(key, item);
    }
  }

  return Array.from(byKey.values());
}

function sanitizeFileName(title: string): string {
  return title.replace(/[\\/:*?"<>|#\[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120) || "Untitled resource";
}

export class VaultResourceRepository {
  constructor(
    private readonly app: App,
    private readonly settings: KnowledgeLibraryPluginSettings,
    private readonly serializer = new ResourceSerializer(),
    private readonly deserializer = new ResourceDeserializer(),
    private readonly tagService = new TagService()
  ) {}

  async list(): Promise<StoredResource[]> {
    const folders = [this.settings.libraryFolder, this.settings.resourcesFolder].map((folder) => normalizePath(folder));
    const files = this.app.vault.getMarkdownFiles().filter((file) => this.isResourceCandidate(file, folders));
    const resources: StoredResource[] = [];

    for (const file of files) {
      const parsed = await this.readResourceFile(file);
      if (parsed && (this.settings.includeLegacyNotes || !parsed.legacy)) {
        resources.push(parsed);
      }
    }

    return deduplicateStoredResources(resources);
  }

  async create(resource: KnowledgeResource): Promise<StoredResource> {
    await this.ensureFolder(this.settings.resourcesFolder);
    const normalized = this.normalizeResource(resource);
    const path = await this.nextAvailablePath(normalizePath(`${this.settings.resourcesFolder}/${sanitizeFileName(normalized.title)}.md`));
    await this.app.vault.create(path, this.serializer.serialize(normalized));

    return { resource: normalized, path, legacy: false };
  }

  async update(path: string, resource: KnowledgeResource): Promise<StoredResource> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) {
      throw new Error(`Resource note not found: ${path}`);
    }

    const current = this.deserializer.deserialize(await this.app.vault.read(file), file.path);
    const normalized = this.normalizeResource({ ...resource, updatedAt: new Date().toISOString() });
    await this.app.vault.modify(file, this.serializer.serialize(normalized, current?.body ?? ""));

    return { resource: normalized, path: file.path, legacy: false };
  }

  async findByResourceId(resourceId: string): Promise<StoredResource | null> {
    return (await this.list()).find((item) => item.resource.id === resourceId) ?? null;
  }

  async findYouTubeByVideoId(videoId: string): Promise<StoredResource | null> {
    return (await this.list()).find((item) => item.resource.type === "youtube" && item.resource.metadata.videoId === videoId) ?? null;
  }

  async findDuplicate(resource: KnowledgeResource): Promise<StoredResource | null> {
    const key = getProviderResourceKey(resource);
    return (await this.list()).find((item) => getProviderResourceKey(item.resource) === key) ?? null;
  }

  private isResourceCandidate(file: TFile, folders: string[]): boolean {
    const path = normalizePath(file.path);
    return folders.some((folder) => path === folder || path.startsWith(`${folder}/`)) && !isExcludedResourcePath(path);
  }

  private async readResourceFile(file: TFile): Promise<StoredResource | null> {
    const parsed = this.deserializer.deserialize(await this.app.vault.read(file), file.path);
    if (!parsed) {
      return null;
    }

    return {
      resource: this.normalizeResource(parsed.resource),
      path: file.path,
      legacy: parsed.legacy
    };
  }

  private normalizeResource(resource: KnowledgeResource): KnowledgeResource {
    const filePath = resource.filePath ? FileResourceService.normalizeVaultPath(resource.filePath) : null;
    return {
      ...resource,
      id: filePath ? FileResourceService.deterministicResourceId(filePath) : resource.id,
      filePath,
      thumbnail: resource.thumbnail ?? (filePath && resource.type === "image" ? filePath : null),
      tags: this.tagService.normalizeTags(resource.tags)
    };
  }

  private async ensureFolder(folder: string): Promise<void> {
    const normalized = normalizePath(folder);
    const segments = normalized.split("/").filter(Boolean);
    let current = "";

    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      if (!this.app.vault.getAbstractFileByPath(current)) {
        await this.app.vault.createFolder(current);
      }
    }
  }

  private async nextAvailablePath(path: string): Promise<string> {
    if (!this.app.vault.getAbstractFileByPath(path)) {
      return path;
    }

    const extensionIndex = path.lastIndexOf(".md");
    const base = extensionIndex > -1 ? path.slice(0, extensionIndex) : path;

    for (let index = 2; index < 1000; index += 1) {
      const candidate = `${base} ${index}.md`;
      if (!this.app.vault.getAbstractFileByPath(candidate)) {
        return candidate;
      }
    }

    throw new Error("Could not allocate a unique resource note path.");
  }
}
