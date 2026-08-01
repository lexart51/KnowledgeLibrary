import { KnowledgeResource } from "../models/KnowledgeResource";
import { parseYouTubeUrl } from "../providers/YouTubeProvider";
import { ResourceDeserializer } from "./ResourceDeserializer";
import { TagService } from "./TagService";

export type LegacyNoteKind = "knowledge-library-v6" | "knowledge-library-v5" | "video-knowledge-manager" | "whatsapp-import" | "unknown";

export interface CompatibilityResult {
  kind: LegacyNoteKind;
  resource: KnowledgeResource | null;
  frontmatter: Record<string, unknown>;
  legacyFields: string[];
  manualReviewReasons: string[];
}

export interface FrontmatterParts {
  frontmatter: Record<string, unknown>;
  body: string;
  invalidYaml: boolean;
  hasFrontmatter: boolean;
}

const LEGACY_FIELDS = ["video_id", "channel", "image", "watched", "date_added", "date_shared"];

export function readFrontmatter(markdown: string): FrontmatterParts {
  if (!markdown.startsWith("---")) {
    return { frontmatter: {}, body: markdown, invalidYaml: false, hasFrontmatter: false };
  }

  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(markdown);
  if (!match) {
    return { frontmatter: {}, body: markdown, invalidYaml: true, hasFrontmatter: true };
  }

  const frontmatter: Record<string, unknown> = {};
  let currentKey: string | null = null;
  let invalidYaml = false;

  for (const line of match[1].split(/\r?\n/)) {
    if (line.trim().length === 0) {
      continue;
    }

    const listMatch = /^\s+-\s*(.*)$/.exec(line);
    if (listMatch && currentKey) {
      const existing = frontmatter[currentKey];
      const values = Array.isArray(existing) ? existing : [];
      values.push(parseScalar(listMatch[1]));
      frontmatter[currentKey] = values;
      continue;
    }

    const nestedPair = /^\s{2}([^:]+):\s*(.*)$/.exec(line);
    if (nestedPair && currentKey) {
      const existing = frontmatter[currentKey];
      const objectValue = existing && typeof existing === "object" && !Array.isArray(existing) ? existing as Record<string, unknown> : {};
      objectValue[nestedPair[1].trim()] = parseScalar(nestedPair[2]);
      frontmatter[currentKey] = objectValue;
      continue;
    }

    const pair = /^([^:]+):\s*(.*)$/.exec(line);
    if (!pair || line.startsWith(" ")) {
      invalidYaml = true;
      continue;
    }

    currentKey = pair[1].trim();
    frontmatter[currentKey] = pair[2].length === 0 ? [] : parseScalar(pair[2]);
  }

  return { frontmatter, body: match[2], invalidYaml, hasFrontmatter: true };
}

function parseScalar(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === "null") {
    return null;
  }
  if (trimmed === "true") {
    return true;
  }
  if (trimmed === "false") {
    return false;
  }
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }
  return trimmed.replace(/^['"]|['"]$/g, "");
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function findFirstUrl(text: string): string | null {
  return /(https?:\/\/[^\s)\]]+)/.exec(text)?.[1] ?? null;
}

function detectKind(path: string, frontmatter: Record<string, unknown>, body: string): LegacyNoteKind {
  const lowerPath = path.toLowerCase();
  const lowerBody = body.toLowerCase();
  const source = stringValue(frontmatter.source)?.toLowerCase() ?? "";
  const type = stringValue(frontmatter.type)?.toLowerCase() ?? "";

  if (frontmatter.resource_id || frontmatter.schema_version === 2) {
    return "knowledge-library-v6";
  }

  if (frontmatter.kl_version || frontmatter.knowledge_library_version || source.includes("knowledge library") || lowerPath.includes("knowledge library v5")) {
    return "knowledge-library-v5";
  }

  if (frontmatter.video_id || frontmatter.channel || frontmatter.watched !== undefined || source.includes("video knowledge manager") || lowerPath.includes("video knowledge manager")) {
    return "video-knowledge-manager";
  }

  if (frontmatter.date_shared || source.includes("whatsapp") || lowerPath.includes("whatsapp") || lowerBody.includes("whatsapp")) {
    return "whatsapp-import";
  }

  if (type === "youtube" || stringValue(frontmatter.url)?.includes("youtube")) {
    return "knowledge-library-v5";
  }

  return "unknown";
}

function legacyFieldsFrom(frontmatter: Record<string, unknown>): string[] {
  return LEGACY_FIELDS.filter((field) => Object.prototype.hasOwnProperty.call(frontmatter, field));
}

export class CompatibilityLayer {
  constructor(
    private readonly deserializer = new ResourceDeserializer(),
    private readonly tagService = new TagService()
  ) {}

  convert(path: string, markdown: string): CompatibilityResult {
    const parts = readFrontmatter(markdown);
    const kind = detectKind(path, parts.frontmatter, parts.body);
    const legacyFields = legacyFieldsFrom(parts.frontmatter);
    const manualReviewReasons: string[] = [];

    if (parts.invalidYaml) {
      manualReviewReasons.push("Invalid YAML frontmatter");
    }

    const parsed = this.deserializer.deserialize(markdown, path);
    if (parsed) {
      const resource = {
        ...parsed.resource,
        tags: this.tagService.normalizeTags(parsed.resource.tags),
        metadata: {
          ...parsed.resource.metadata,
          legacyKind: kind,
          originalPath: path
        }
      };
      return { kind, resource, frontmatter: parts.frontmatter, legacyFields, manualReviewReasons };
    }

    if (kind === "unknown") {
      return { kind, resource: null, frontmatter: parts.frontmatter, legacyFields, manualReviewReasons };
    }

    const url = stringValue(parts.frontmatter.url) ?? findFirstUrl(parts.body);
    const videoId = stringValue(parts.frontmatter.video_id) ?? (url ? parseYouTubeUrl(url)?.videoId ?? null : null);
    const title = stringValue(parts.frontmatter.title) ?? path.split("/").pop()?.replace(/\.md$/i, "") ?? "Untitled resource";

    if (!url && !videoId) {
      manualReviewReasons.push("No URL or provider-specific id found");
      return { kind, resource: null, frontmatter: parts.frontmatter, legacyFields, manualReviewReasons };
    }

    const createdAt = stringValue(parts.frontmatter.created_at ?? parts.frontmatter.date_added ?? parts.frontmatter.date_shared) ?? new Date(0).toISOString();
    const canonicalUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : url;
    const resource = this.deserializer.deserialize(
      `---\ntitle: ${title}\ntype: ${videoId ? "youtube" : "website"}\nurl: ${canonicalUrl ?? ""}\ncreator: ${stringValue(parts.frontmatter.creator ?? parts.frontmatter.channel) ?? ""}\nthumbnail: ${stringValue(parts.frontmatter.thumbnail ?? parts.frontmatter.image) ?? ""}\ncompleted: ${parts.frontmatter.completed === true || parts.frontmatter.watched === true}\ncreated_at: ${createdAt}\nmetadata:\n  legacyKind: ${kind}\n  originalPath: ${path}\n  ${videoId ? `videoId: ${videoId}` : ""}\n---\n${parts.body}`,
      path
    )?.resource ?? null;

    return {
      kind,
      resource: resource ? { ...resource, tags: this.tagService.normalizeTags(resource.tags) } : null,
      frontmatter: parts.frontmatter,
      legacyFields,
      manualReviewReasons
    };
  }
}


