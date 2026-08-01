import { KnowledgeResource } from "../models/KnowledgeResource";
import { CollectionService } from "./CollectionService";
import { ProgressService } from "./ProgressService";
import { TagService } from "./TagService";

export interface SerializedResourceNote {
  frontmatter: Record<string, unknown>;
  markdown: string;
}

const CANONICAL_FRONTMATTER_KEYS = new Set([
  "schema_version",
  "resource_id",
  "type",
  "title",
  "creator",
  "source",
  "url",
  "file_path",
  "thumbnail",
  "tags",
  "collections",
  "status",
  "favorite",
  "completed",
  "progress",
  "progress_unit",
  "current_position",
  "total_units",
  "priority",
  "related_resources",
  "rating",
  "created_at",
  "updated_at",
  "metadata"
]);

function scalarToYaml(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }

  const text = String(value);
  if (text === "" || /[:#\[\]{}\n]|^\s|\s$/.test(text)) {
    return JSON.stringify(text);
  }

  return text;
}

function serializeValue(key: string, value: unknown): string[] {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [`${key}: []`];
    }

    return [
      `${key}:`,
      ...value.flatMap((entry) => {
        if (entry && typeof entry === "object" && !Array.isArray(entry)) {
          const entries = Object.entries(entry as Record<string, unknown>);
          if (entries.length === 0) {
            return ["  - {}"];
          }
          const [firstKey, firstValue] = entries[0];
          return [
            `  - ${firstKey}: ${scalarToYaml(firstValue)}`,
            ...entries.slice(1).flatMap(([childKey, childValue]) => serializeValue(childKey, childValue).map((line) => `    ${line}`))
          ];
        }
        return `  - ${scalarToYaml(entry)}`;
      })
    ];
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return [`${key}: {}`];
    }

    return [
      `${key}:`,
      ...entries.flatMap(([childKey, childValue]) => serializeValue(childKey, childValue).map((line) => `  ${line}`))
    ];
  }

  return [`${key}: ${scalarToYaml(value)}`];
}

export class ResourceSerializer {
  constructor(
    private readonly tagService = new TagService(),
    private readonly collectionService = new CollectionService(),
    private readonly progressService = new ProgressService()
  ) {}

  serialize(resource: KnowledgeResource, preservedMarkdown = "", preservedFrontmatter: Record<string, unknown> = {}): string {
    const frontmatter = this.mergeFrontmatter(preservedFrontmatter, this.toFrontmatter(resource));
    const yaml = Object.entries(frontmatter).flatMap(([key, value]) => serializeValue(key, value)).join("\n");
    const body = preservedMarkdown.trim().length > 0 ? `\n\n${preservedMarkdown.trim()}\n` : "\n";

    return `---\n${yaml}\n---${body}`;
  }

  toFrontmatter(resource: KnowledgeResource): Record<string, unknown> {
    const progress = this.progressService.normalize({
      progress: resource.progress,
      progress_unit: resource.progress_unit,
      current_position: resource.current_position,
      total_units: resource.total_units,
      completed: resource.completed
    });

    return {
      schema_version: 3,
      resource_id: resource.id,
      type: resource.type,
      title: resource.title,
      creator: resource.creator,
      source: resource.source,
      url: resource.url,
      file_path: resource.filePath,
      thumbnail: resource.thumbnail,
      tags: this.tagService.normalizeTags(resource.tags),
      collections: this.collectionService.normalizeCollections(resource.collections ?? []),
      status: resource.status,
      favorite: resource.favorite,
      completed: progress.completed,
      progress: progress.progress,
      progress_unit: progress.progress_unit,
      current_position: progress.current_position,
      total_units: progress.total_units,
      priority: resource.priority ?? "normal",
      related_resources: resource.related_resources ?? [],
      rating: resource.rating,
      created_at: resource.createdAt,
      updated_at: resource.updatedAt,
      metadata: resource.metadata
    };
  }

  private mergeFrontmatter(preservedFrontmatter: Record<string, unknown>, canonical: Record<string, unknown>): Record<string, unknown> {
    const unknown = Object.fromEntries(Object.entries(preservedFrontmatter).filter(([key]) => !CANONICAL_FRONTMATTER_KEYS.has(key)));
    return { ...unknown, ...canonical };
  }
}
