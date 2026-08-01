import { App, normalizePath, TFile } from "obsidian";
import { KnowledgeResource } from "../models/KnowledgeResource";
import { parseYouTubeUrl } from "../providers/YouTubeProvider";
import { CompatibilityLayer, CompatibilityResult, LegacyNoteKind } from "./CompatibilityLayer";
import { getProviderResourceKey, isExcludedResourcePath } from "./VaultResourceRepository";

export interface MigrationResourceRecord extends CompatibilityResult {
  path: string;
}

export interface MigrationAuditReport {
  totalResources: number;
  duplicatedIds: string[];
  duplicatedYouTubeIds: string[];
  missingThumbnails: string[];
  unavailableResources: string[];
  orphanNotes: string[];
  legacyFieldsStillPresent: Array<{ path: string; fields: string[] }>;
  invalidYaml: string[];
  invalidUrls: string[];
}

export interface MigrationSimulationReport {
  resourcesDetected: MigrationResourceRecord[];
  resourcesIgnored: Array<{ path: string; reason: string }>;
  resourcesThatWouldBeConverted: MigrationResourceRecord[];
  resourcesRequiringManualReview: Array<{ path: string; reasons: string[] }>;
}

export interface MigrationReport {
  generatedAt: string;
  audit: MigrationAuditReport;
  simulation: MigrationSimulationReport;
}

function isMarkdownFile(file: unknown): file is TFile {
  return Boolean(file && typeof file === "object" && "path" in file && typeof (file as { path: unknown }).path === "string");
}

function isInvalidUrl(url: string | null): boolean {
  if (!url) {
    return false;
  }

  try {
    new URL(url);
    return false;
  } catch {
    return true;
  }
}

function youtubeIdOf(resource: KnowledgeResource): string | null {
  if (resource.type !== "youtube") {
    return null;
  }

  if (typeof resource.metadata.videoId === "string") {
    return resource.metadata.videoId;
  }

  return resource.url ? parseYouTubeUrl(resource.url)?.videoId ?? null : null;
}

function duplicatedValues(values: Array<string | null>): string[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (value) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries()).filter(([, count]) => count > 1).map(([value]) => value).sort();
}

function hasProviderDuplicate(records: MigrationResourceRecord[], record: MigrationResourceRecord): boolean {
  if (!record.resource) {
    return false;
  }

  const key = getProviderResourceKey(record.resource);
  return records.some((candidate) => candidate !== record && candidate.resource && getProviderResourceKey(candidate.resource) === key);
}

export class MigrationService {
  constructor(
    private readonly app: App,
    private readonly compatibilityLayer = new CompatibilityLayer()
  ) {}

  async analyzeVault(): Promise<MigrationReport> {
    const files = this.app.vault.getMarkdownFiles().filter((file) => isMarkdownFile(file) && !isExcludedResourcePath(file.path));
    const detected: MigrationResourceRecord[] = [];
    const ignored: Array<{ path: string; reason: string }> = [];

    for (const file of files) {
      const markdown = await this.app.vault.read(file);
      const result = this.compatibilityLayer.convert(normalizePath(file.path), markdown);

      if (result.resource) {
        detected.push({ ...result, path: normalizePath(file.path) });
      } else {
        const reason = result.manualReviewReasons.length > 0 ? result.manualReviewReasons.join(", ") : result.kind === "unknown" ? "No compatible resource signature detected" : "No convertible resource fields found";
        ignored.push({ path: normalizePath(file.path), reason });
      }
    }

    const manualReview = detected
      .map((record) => ({ path: record.path, reasons: this.reviewReasons(record, detected) }))
      .filter((record) => record.reasons.length > 0);

    const converted = detected.filter((record) => !manualReview.some((review) => review.path === record.path));

    return {
      generatedAt: new Date().toISOString(),
      audit: this.buildAudit(detected, ignored),
      simulation: {
        resourcesDetected: detected,
        resourcesIgnored: ignored,
        resourcesThatWouldBeConverted: converted,
        resourcesRequiringManualReview: manualReview
      }
    };
  }

  private buildAudit(records: MigrationResourceRecord[], ignored: Array<{ path: string; reason: string }>): MigrationAuditReport {
    return {
      totalResources: records.length,
      duplicatedIds: duplicatedValues(records.map((record) => record.resource?.id ?? null)),
      duplicatedYouTubeIds: duplicatedValues(records.map((record) => record.resource ? youtubeIdOf(record.resource) : null)),
      missingThumbnails: records.filter((record) => !record.resource?.thumbnail).map((record) => record.path),
      unavailableResources: records.filter((record) => record.resource?.status === "unavailable").map((record) => record.path),
      orphanNotes: ignored.map((item) => item.path),
      legacyFieldsStillPresent: records.filter((record) => record.legacyFields.length > 0).map((record) => ({ path: record.path, fields: record.legacyFields })),
      invalidYaml: [
        ...records.filter((record) => record.manualReviewReasons.includes("Invalid YAML frontmatter")).map((record) => record.path),
        ...ignored.filter((item) => item.reason.includes("Invalid YAML frontmatter")).map((item) => item.path)
      ],
      invalidUrls: records.filter((record) => isInvalidUrl(record.resource?.url ?? null)).map((record) => record.path)
    };
  }

  private reviewReasons(record: MigrationResourceRecord, records: MigrationResourceRecord[]): string[] {
    const reasons = [...record.manualReviewReasons];
    const url = record.resource?.url ?? null;

    if (isInvalidUrl(url)) {
      reasons.push("Invalid URL");
    }

    if (!record.resource?.thumbnail) {
      reasons.push("Missing thumbnail");
    }

    if (record.resource?.status === "unavailable") {
      reasons.push("Unavailable resource");
    }

    if (hasProviderDuplicate(records, record)) {
      reasons.push("Duplicate provider-specific resource");
    }

    return Array.from(new Set(reasons));
  }
}

export function labelForLegacyKind(kind: LegacyNoteKind): string {
  switch (kind) {
    case "knowledge-library-v6":
      return "KnowledgeLibrary v6";
    case "knowledge-library-v5":
      return "Knowledge Library v5";
    case "video-knowledge-manager":
      return "Video Knowledge Manager";
    case "whatsapp-import":
      return "WhatsApp import";
    case "unknown":
      return "Unknown";
  }
}



