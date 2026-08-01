import { KnowledgeResource } from "../models/KnowledgeResource";
import { TagService } from "./TagService";

export interface SerializedResourceNote {
  frontmatter: Record<string, unknown>;
  markdown: string;
}

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

    return [`${key}:`, ...value.map((entry) => `  - ${scalarToYaml(entry)}`)];
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
  constructor(private readonly tagService = new TagService()) {}

  serialize(resource: KnowledgeResource, preservedMarkdown = ""): string {
    const frontmatter = this.toFrontmatter(resource);
    const yaml = Object.entries(frontmatter).flatMap(([key, value]) => serializeValue(key, value)).join("\n");
    const body = preservedMarkdown.trim().length > 0 ? `\n\n${preservedMarkdown.trim()}\n` : "\n";

    return `---\n${yaml}\n---${body}`;
  }

  toFrontmatter(resource: KnowledgeResource): Record<string, unknown> {
    return {
      schema_version: 2,
      resource_id: resource.id,
      type: resource.type,
      title: resource.title,
      creator: resource.creator,
      source: resource.source,
      url: resource.url,
      file_path: resource.filePath,
      thumbnail: resource.thumbnail,
      tags: this.tagService.normalizeTags(resource.tags),
      status: resource.status,
      favorite: resource.favorite,
      completed: resource.completed,
      rating: resource.rating,
      created_at: resource.createdAt,
      updated_at: resource.updatedAt,
      metadata: resource.metadata
    };
  }
}
