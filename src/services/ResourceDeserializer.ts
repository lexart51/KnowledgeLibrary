import {
  KnowledgeResource,
  KnowledgeResourceMetadata,
  KnowledgeResourcePriority,
  KnowledgeResourceProgressUnit,
  KnowledgeResourceRelationship,
  KnowledgeResourceRelationshipType,
  KnowledgeResourceStatus,
  KnowledgeResourceType
} from "../models/KnowledgeResource";
import { buildYouTubeThumbnailFallbacks } from "../providers/YouTubeProvider";
import { createResourceId } from "../utils/ids";
import { CollectionService } from "./CollectionService";
import { ProgressService } from "./ProgressService";
import { RELATIONSHIP_TYPES } from "./RelationshipService";
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

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line || /^\s/.test(line)) {
      continue;
    }

    const pairMatch = /^([^:]+):\s*(.*)$/.exec(line);
    if (!pairMatch) {
      continue;
    }

    const key = pairMatch[1].trim();
    const rawValue = pairMatch[2];
    if (rawValue.length > 0) {
      result[key] = parseScalar(rawValue);
      continue;
    }

    const children: string[] = [];
    while (index + 1 < lines.length && /^\s+/.test(lines[index + 1])) {
      index += 1;
      children.push(lines[index]);
    }
    result[key] = parseChildren(children);
  }

  return result;
}

function lineIndent(line: string): number {
  return /^\s*/.exec(line)?.[0].length ?? 0;
}

function parseChildren(lines: string[]): unknown {
  if (lines.length === 0) {
    return {};
  }

  const baseIndent = lineIndent(lines[0]);
  const baseLines = lines.filter((line) => lineIndent(line) === baseIndent);
  const isList = baseLines.length > 0 && baseLines.every((line) => /^\s*-\s?/.test(line));

  if (isList) {
    const list: unknown[] = [];
    let currentObject: Record<string, unknown> | null = null;
    let currentObjectIndent = -1;

    for (const line of lines) {
      const indent = lineIndent(line);
      if (indent === baseIndent) {
        const itemMatch = /^\s*-\s?(.*)$/.exec(line);
        const item = itemMatch ? itemMatch[1] : "";
        const isQuotedItem = /^["']/.test(item);
        const pair = isQuotedItem ? null : /^([^:]+):\s*(.*)$/.exec(item);
        if (pair && pair[2].length > 0) {
          currentObject = { [pair[1].trim()]: parseScalar(pair[2]) };
          list.push(currentObject);
          currentObjectIndent = indent;
        } else {
          currentObject = null;
          list.push(parseScalar(item));
        }
        continue;
      }

      const nestedPair = /^\s+([^:]+):\s*(.*)$/.exec(line);
      if (nestedPair && currentObject && indent > currentObjectIndent) {
        currentObject[nestedPair[1].trim()] = parseScalar(nestedPair[2]);
      }
    }

    return list;
  }

  const objectValue: Record<string, unknown> = {};
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (lineIndent(line) !== baseIndent) {
      continue;
    }

    const pair = /^\s*([^:]+):\s*(.*)$/.exec(line);
    if (!pair) {
      continue;
    }

    const key = pair[1].trim();
    const rawValue = pair[2];
    if (rawValue.length > 0) {
      objectValue[key] = parseScalar(rawValue);
      continue;
    }

    const nestedLines: string[] = [];
    while (index + 1 < lines.length && lineIndent(lines[index + 1]) > baseIndent) {
      index += 1;
      nestedLines.push(lines[index]);
    }
    objectValue[key] = parseChildren(nestedLines);
  }
  return objectValue;
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

function normalizeDateString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }
  return trimmed;
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

function numberOrDefault(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
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

function progressUnitFrom(value: unknown): KnowledgeResourceProgressUnit {
  return value === "pages" || value === "slides" || value === "chapters" || value === "minutes" || value === "custom" ? value : "percent";
}

function priorityFrom(value: unknown): KnowledgeResourcePriority {
  return value === "low" || value === "high" ? value : "normal";
}

function relationshipTypeFrom(value: unknown): KnowledgeResourceRelationshipType {
  return RELATIONSHIP_TYPES.includes(value as KnowledgeResourceRelationshipType) ? value as KnowledgeResourceRelationshipType : "related";
}

function relationshipsFrom(value: unknown): KnowledgeResourceRelationship[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return [];
    }
    const record = item as Record<string, unknown>;
    const resourceId = stringOrNull(record.resource_id);
    if (!resourceId) {
      return [];
    }
    return [{ resource_id: resourceId, relationship_type: relationshipTypeFrom(record.relationship_type), note: stringOrDefault(record.note, "") }];
  });
}

export class ResourceDeserializer {
  constructor(
    private readonly tagService = new TagService(),
    private readonly collectionService = new CollectionService(),
    private readonly progressService = new ProgressService()
  ) {}

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
    const createdAt = normalizeDateString(frontmatter.created_at) ?? normalizeDateString(frontmatter.date_added) ?? normalizeDateString(frontmatter.date_shared) ?? new Date(0).toISOString();
    const updatedAt = normalizeDateString(frontmatter.updated_at) ?? normalizeDateString(frontmatter.date_updated) ?? createdAt;
    const completed = booleanOrDefault(frontmatter.completed, booleanOrDefault(frontmatter.watched, false));
    const progress = this.progressService.normalize({
      completed,
      progress: numberOrDefault(frontmatter.progress, completed ? 100 : 0),
      progress_unit: progressUnitFrom(frontmatter.progress_unit),
      current_position: numberOrNull(frontmatter.current_position),
      total_units: numberOrNull(frontmatter.total_units)
    });

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
        collections: this.collectionService.normalizeCollections(tagsFrom(frontmatter.collections)),
        status: statusFrom(frontmatter.status),
        favorite: booleanOrDefault(frontmatter.favorite, false),
        completed: progress.completed,
        progress: progress.progress,
        progress_unit: progress.progress_unit,
        current_position: progress.current_position,
        total_units: progress.total_units,
        priority: priorityFrom(frontmatter.priority),
        related_resources: relationshipsFrom(frontmatter.related_resources),
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
