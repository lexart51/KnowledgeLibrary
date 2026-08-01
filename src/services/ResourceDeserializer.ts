import { KnowledgeResource, KnowledgeResourceMetadata, KnowledgeResourceStatus, KnowledgeResourceType } from "../models/KnowledgeResource";
import { buildYouTubeThumbnailFallbacks } from "../providers/YouTubeProvider";
import { createResourceId } from "../utils/ids";
import { TagService } from "./TagService";

export interface DeserializedResourceNote {
  resource: KnowledgeResource;
  body: string;
  frontmatter: Record<string, unknown>;
  legacy: boolean;
}

function parseScalar(value: string): unknown {
  const trimmed = value.trim();

  if (trimmed === "" || trimmed === "null") {
    return null;
  }

  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  if (trimmed === "[]") {
    return [];
  }

  if (trimmed === "{}") {
    return {};
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }

  return trimmed;
}

function parseYamlBlock(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split(/\r?\n/);
  let currentKey: string | null = null;

  for (const line of lines) {
    if (line.trim().length === 0) {
      continue;
    }

    const listMatch = /^\s+-\s*(.*)$/.exec(line);
    if (listMatch && currentKey) {
      const existing = result[currentKey];
      const values = Array.isArray(existing) ? existing : [];
      values.push(parseScalar(listMatch[1]));
      result[currentKey] = values;
      continue;
    }

    const nestedPairMatch = /^\s{2}([^:]+):\s*(.*)$/.exec(line);
    if (nestedPairMatch && currentKey) {
      const existing = result[currentKey];
      const objectValue = existing && typeof existing === "object" && !Array.isArray(existing) ? existing as Record<string, unknown> : {};
      objectValue[nestedPairMatch[1].trim()] = parseScalar(nestedPairMatch[2]);
      result[currentKey] = objectValue;
      continue;
    }

    const pairMatch = /^([^:]+):\s*(.*)$/.exec(line);
    if (!pairMatch) {
      continue;
    }

    currentKey = pairMatch[1].trim();
    const rawValue = pairMatch[2];
    result[currentKey] = rawValue.length === 0 ? {} : parseScalar(rawValue);
  }

  return result;
}

function splitFrontmatter(markdown: string): { frontmatter: Record<string, unknown>; body: string } {
  if (!markdown.startsWith("---")) {
    return { frontmatter: {}, body: markdown };
  }

  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(markdown);
  if (!match) {
    return { frontmatter: {}, body: markdown };
  }

  return {
    frontmatter: parseYamlBlock(match[1]),
    body: match[2]
  };
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function stringOrDefault(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function booleanOrDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function tagsFrom(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === "string");
  }

  if (typeof value === "string") {
    return value.split(",").map((tag) => tag.trim()).filter(Boolean);
  }

  return [];
}

function metadataFrom(value: unknown): KnowledgeResourceMetadata {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as KnowledgeResourceMetadata) : {};
}

function typeFrom(value: unknown, url: string | null, filePath: string | null, videoId: string | null): KnowledgeResourceType {
  if (
    value === "youtube" ||
    value === "website" ||
    value === "pdf" ||
    value === "book" ||
    value === "powerpoint" ||
    value === "document" ||
    value === "markdown" ||
    value === "image" ||
    value === "script" ||
    value === "skill" ||
    value === "archive" ||
    value === "file" ||
    value === "other"
  ) {
    return value;
  }

  if (videoId || url?.includes("youtube.com") || url?.includes("youtu.be")) {
    return "youtube";
  }

  return filePath ? "file" : "website";
}

function statusFrom(value: unknown): KnowledgeResourceStatus {
  return value === "archived" || value === "unavailable" ? value : "active";
}

export class ResourceDeserializer {
  constructor(private readonly tagService = new TagService()) {}

  deserialize(markdown: string, pathSeed = "resource"): DeserializedResourceNote | null {
    const { frontmatter, body } = splitFrontmatter(markdown);
    const legacyVideoId = stringOrNull(frontmatter.video_id);
    const url = stringOrNull(frontmatter.url) ?? (legacyVideoId ? `https://www.youtube.com/watch?v=${legacyVideoId}` : null);
    const filePath = stringOrNull(frontmatter.file_path) ?? stringOrNull(frontmatter.filePath);
    const metadata = metadataFrom(frontmatter.metadata);

    if (legacyVideoId && !metadata.videoId) {
      metadata.videoId = legacyVideoId;
    }

    const type = typeFrom(frontmatter.type, url, filePath, legacyVideoId);
    const id = stringOrDefault(frontmatter.resource_id, createResourceId(`${type}:${legacyVideoId ?? url ?? filePath ?? pathSeed}`));
    const title = stringOrDefault(frontmatter.title, "Untitled resource");
    const createdAt = stringOrDefault(frontmatter.created_at ?? frontmatter.date_added ?? frontmatter.date_shared, new Date(0).toISOString());
    const updatedAt = stringOrDefault(frontmatter.updated_at, createdAt);

    if (!frontmatter.resource_id && !frontmatter.type && !url && !filePath && !legacyVideoId) {
      return null;
    }

    return {
      resource: {
        id,
        type,
        title,
        creator: stringOrNull(frontmatter.creator) ?? stringOrNull(frontmatter.channel),
        source: stringOrDefault(frontmatter.source, type),
        url,
        filePath,
        thumbnail: stringOrNull(frontmatter.thumbnail) ?? stringOrNull(frontmatter.image) ?? (legacyVideoId ? buildYouTubeThumbnailFallbacks(legacyVideoId)[0] : null),
        tags: this.tagService.normalizeTags(tagsFrom(frontmatter.tags)),
        status: statusFrom(frontmatter.status),
        favorite: booleanOrDefault(frontmatter.favorite, false),
        completed: booleanOrDefault(frontmatter.completed, booleanOrDefault(frontmatter.watched, false)),
        rating: numberOrNull(frontmatter.rating),
        createdAt,
        updatedAt,
        metadata
      },
      body,
      frontmatter,
      legacy: !frontmatter.resource_id || Boolean(frontmatter.video_id || frontmatter.channel || frontmatter.image || frontmatter.watched)
    };
  }
}
