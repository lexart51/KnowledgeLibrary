import { App, normalizePath, TFile } from "obsidian";
import { KnowledgeLibraryPluginSettings } from "../core/settings";
import { KnowledgeResource } from "../models/KnowledgeResource";
import { buildYouTubeThumbnailFallbacks, parseYouTubeUrl } from "../providers/YouTubeProvider";
import { ResourceDeserializer } from "./ResourceDeserializer";
import { ResourceSerializer } from "./ResourceSerializer";
import { TagService } from "./TagService";
import { MigrationResourceRecord, MigrationService } from "./MigrationService";

export interface WritePlanItem {
  path: string;
  reason: string;
}

export interface WriteOperationReport {
  changed: string[];
  skipped: WritePlanItem[];
  failed: WritePlanItem[];
  manualReview: WritePlanItem[];
  reportPath: string | null;
  dryRun: boolean;
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function isTFile(file: unknown): file is TFile {
  return file instanceof TFile || Boolean(file && typeof file === "object" && "path" in file);
}

async function ensureFolder(app: App, folder: string): Promise<void> {
  const parts = normalizePath(folder).split("/").filter(Boolean);
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    if (!app.vault.getAbstractFileByPath(current)) {
      await app.vault.createFolder(current);
    }
  }
}

async function writeReport(app: App, folder: string, name: string, content: string, dryRun: boolean): Promise<string | null> {
  if (dryRun) {
    return null;
  }
  await ensureFolder(app, folder);
  const path = normalizePath(`${folder}/${name}`);
  await app.vault.create(path, content);
  return path;
}

function markdownReport(title: string, report: WriteOperationReport): string {
  const lines = [`# ${title}`, "", `Generated: ${new Date().toISOString()}`, `Dry run: ${report.dryRun}`, ""];
  for (const [heading, values] of [
    ["Changed", report.changed.map((path) => ({ path, reason: "updated" }))],
    ["Skipped", report.skipped],
    ["Failed", report.failed],
    ["Manual Review", report.manualReview]
  ] as Array<[string, WritePlanItem[]]>) {
    lines.push(`## ${heading}`, "");
    if (values.length === 0) {
      lines.push("None", "");
    } else {
      lines.push(...values.map((item) => `- ${item.path}${item.reason ? `: ${item.reason}` : ""}`), "");
    }
  }
  return `${lines.join("\n")}\n`;
}

export class SafeMigrationService {
  private readonly deserializer = new ResourceDeserializer();
  private readonly serializer = new ResourceSerializer();

  constructor(
    private readonly app: App,
    private readonly settings: KnowledgeLibraryPluginSettings,
    private readonly migrationService = new MigrationService(app),
    private readonly tagService = new TagService()
  ) {}

  async getPlan(): Promise<{ convertible: MigrationResourceRecord[]; manualReview: WritePlanItem[] }> {
    const report = await this.migrationService.analyzeVault();
    return {
      convertible: report.simulation.resourcesThatWouldBeConverted,
      manualReview: report.simulation.resourcesRequiringManualReview.map((item) => ({ path: item.path, reason: item.reasons.join(", ") }))
    };
  }

  async createBackup(dryRun = false): Promise<WriteOperationReport> {
    const plan = await this.getPlan();
    const backupFolder = normalizePath(`${this.safetyRootFolder()}/Migration Backups/${timestamp()}`);
    const changed: string[] = [];
    const failed: WritePlanItem[] = [];

    if (!dryRun) {
      await ensureFolder(this.app, backupFolder);
    }

    for (const item of plan.convertible) {
      try {
        const file = this.app.vault.getAbstractFileByPath(item.path);
        if (!isTFile(file)) {
          failed.push({ path: item.path, reason: "Source note not found" });
          continue;
        }
        const content = await this.app.vault.read(file);
        const backupPath = normalizePath(`${backupFolder}/${item.path.replace(/[\\/:]/g, "__")}`);
        if (!dryRun) {
          await this.app.vault.create(backupPath, content);
        }
        changed.push(item.path);
      } catch (error) {
        failed.push({ path: item.path, reason: error instanceof Error ? error.message : "Backup failed" });
      }
    }

    const report: WriteOperationReport = { changed, skipped: [], failed, manualReview: plan.manualReview, reportPath: null, dryRun };
    report.reportPath = await writeReport(this.app, backupFolder, "migration-backup-report.md", markdownReport("Migration Backup Report", report), dryRun);
    return report;
  }


  private safetyRootFolder(): string {
    const library = normalizePath(this.settings.libraryFolder).split("/").filter(Boolean)[0] ?? "KnowledgeLibrary";
    return `${library} - KnowledgeLibrary v6 Safety`;
  }
  async applyMigration(dryRun = false): Promise<WriteOperationReport> {
    const plan = await this.getPlan();
    const reportFolder = normalizePath(`${this.safetyRootFolder()}/Migration Reports/${timestamp()}`);
    const changed: string[] = [];
    const failed: WritePlanItem[] = [];

    for (const item of plan.convertible) {
      try {
        const file = this.app.vault.getAbstractFileByPath(item.path);
        if (!isTFile(file) || !item.resource) {
          failed.push({ path: item.path, reason: "Convertible note not found" });
          continue;
        }
        const parsed = this.deserializer.deserialize(await this.app.vault.read(file), item.path);
        if (!parsed) {
          failed.push({ path: item.path, reason: "Could not deserialize source note" });
          continue;
        }
        const resource: KnowledgeResource = {
          ...item.resource,
          tags: this.tagService.normalizeTags(item.resource.tags)
        };
        if (!dryRun) {
          await this.app.vault.modify(file, this.serializer.serialize(resource, parsed.body));
        }
        changed.push(item.path);
      } catch (error) {
        failed.push({ path: item.path, reason: error instanceof Error ? error.message : "Migration failed" });
      }
    }

    const report: WriteOperationReport = { changed, skipped: [], failed, manualReview: plan.manualReview, reportPath: null, dryRun };
    report.reportPath = await writeReport(this.app, reportFolder, "migration-apply-report.md", markdownReport("Migration Apply Report", report), dryRun);
    return report;
  }
}

export interface TagReplacement {
  path: string;
  before: string[];
  after: string[];
}

export class TagConsolidationService {
  private readonly deserializer = new ResourceDeserializer();
  private readonly serializer = new ResourceSerializer();

  constructor(
    private readonly app: App,
    private readonly tagService = new TagService()
  ) {}

  async analyze(): Promise<TagReplacement[]> {
    const replacements: TagReplacement[] = [];
    for (const file of this.app.vault.getMarkdownFiles()) {
      const parsed = this.deserializer.deserialize(await this.app.vault.read(file), file.path);
      if (!parsed) {
        continue;
      }
      const after = this.tagService.normalizeTags(parsed.resource.tags);
      if (parsed.resource.tags.join("\u0000") !== after.join("\u0000")) {
        replacements.push({ path: file.path, before: parsed.resource.tags, after });
      }
    }
    return replacements;
  }

  async consolidate(dryRun = false): Promise<WriteOperationReport> {
    const replacements = await this.analyze();
    const changed: string[] = [];
    const failed: WritePlanItem[] = [];
    for (const item of replacements) {
      try {
        const file = this.app.vault.getAbstractFileByPath(item.path);
        if (!isTFile(file)) {
          failed.push({ path: item.path, reason: "Note not found" });
          continue;
        }
        const parsed = this.deserializer.deserialize(await this.app.vault.read(file), item.path);
        if (!parsed) {
          continue;
        }
        if (!dryRun) {
          await this.app.vault.modify(file, this.serializer.serialize({ ...parsed.resource, tags: item.after, updatedAt: new Date().toISOString() }, parsed.body));
        }
        changed.push(item.path);
      } catch (error) {
        failed.push({ path: item.path, reason: error instanceof Error ? error.message : "Tag consolidation failed" });
      }
    }
    const report: WriteOperationReport = { changed, skipped: [], failed, manualReview: [], reportPath: null, dryRun };
    report.reportPath = await writeReport(this.app, `KnowledgeLibrary Tag Reports/${timestamp()}`, "tag-consolidation-report.md", markdownReport("Tag Consolidation Report", report), dryRun);
    return report;
  }
}

export interface ThumbnailRepairItem {
  path: string;
  videoId: string;
  thumbnail: string;
}

export class ThumbnailRepairService {
  private readonly deserializer = new ResourceDeserializer();
  private readonly serializer = new ResourceSerializer();

  constructor(private readonly app: App) {}

  async analyze(): Promise<ThumbnailRepairItem[]> {
    const items: ThumbnailRepairItem[] = [];
    for (const file of this.app.vault.getMarkdownFiles()) {
      const parsed = this.deserializer.deserialize(await this.app.vault.read(file), file.path);
      const resource = parsed?.resource;
      if (!resource || resource.type !== "youtube") {
        continue;
      }
      const videoId = typeof resource.metadata.videoId === "string" ? resource.metadata.videoId : resource.url ? parseYouTubeUrl(resource.url)?.videoId : null;
      if (!videoId) {
        continue;
      }
      const expected = buildYouTubeThumbnailFallbacks(videoId)[0];
      const unusable = !resource.thumbnail || !resource.thumbnail.includes(`/vi/${videoId}/`);
      if (unusable) {
        items.push({ path: file.path, videoId, thumbnail: expected });
      }
    }
    return items;
  }

  async repair(dryRun = false): Promise<WriteOperationReport> {
    const items = await this.analyze();
    const changed: string[] = [];
    const failed: WritePlanItem[] = [];
    for (const item of items) {
      try {
        const file = this.app.vault.getAbstractFileByPath(item.path);
        if (!isTFile(file)) {
          failed.push({ path: item.path, reason: "Note not found" });
          continue;
        }
        const parsed = this.deserializer.deserialize(await this.app.vault.read(file), item.path);
        if (!parsed) {
          continue;
        }
        if (!dryRun) {
          await this.app.vault.modify(file, this.serializer.serialize({
            ...parsed.resource,
            thumbnail: item.thumbnail,
            metadata: { ...parsed.resource.metadata, thumbnailFallbacks: buildYouTubeThumbnailFallbacks(item.videoId) },
            updatedAt: new Date().toISOString()
          }, parsed.body));
        }
        changed.push(item.path);
      } catch (error) {
        failed.push({ path: item.path, reason: error instanceof Error ? error.message : "Thumbnail repair failed" });
      }
    }
    const report: WriteOperationReport = { changed, skipped: [], failed, manualReview: [], reportPath: null, dryRun };
    report.reportPath = await writeReport(this.app, `KnowledgeLibrary Thumbnail Reports/${timestamp()}`, "thumbnail-repair-report.md", markdownReport("Thumbnail Repair Report", report), dryRun);
    return report;
  }
}
