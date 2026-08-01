import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { ExternalResourceReference, VaultConnector } from "../models/VaultConnector";
import { ResourceDeserializer } from "../services/ResourceDeserializer";
import { CollectionService } from "../services/CollectionService";
import { TagService } from "../services/TagService";
import { FileResourceService } from "../services/FileResourceService";
import { VaultConnectorService } from "../services/VaultConnectorService";

export interface ConnectorProvider {
  readonly role: VaultConnector["role"];
  scan(connector: VaultConnector, rootPath: string): ExternalResourceReference[];
}

const connectorService = new VaultConnectorService();
const tagService = new TagService();
const collectionService = new CollectionService();

export function walkConnectorFiles(rootPath: string, connector: VaultConnector): string[] {
  const files: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = join(directory, entry.name);
      const relativePath = connectorService.normalizePath(relative(rootPath, absolute));
      if (entry.isDirectory()) {
        const directoryProbe = `${relativePath}/__knowledge_library_probe__.md`;
        if (!connectorService.shouldScanPath(directoryProbe, { ...connector, includePatterns: ["**/*"] })) {
          continue;
        }
        visit(absolute);
      } else if (connectorService.shouldScanPath(relativePath, connector)) {
        files.push(absolute);
      }
    }
  };
  visit(rootPath);
  return files;
}

function splitFrontmatter(markdown: string): Record<string, unknown> {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown);
  if (!match) {
    return {};
  }
  const values: Record<string, unknown> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([^:]+):\s*(.*)$/.exec(line);
    if (pair) {
      values[pair[1].trim()] = pair[2].trim().replace(/^"|"$/g, "");
    }
  }
  return values;
}

function tagsFromMarkdown(markdown: string, frontmatter: Record<string, unknown>): string[] {
  const frontmatterTags = typeof frontmatter.tags === "string" ? String(frontmatter.tags).split(",") : [];
  const inlineTags = Array.from(markdown.matchAll(/(^|\s)#([\p{L}\p{N}_/-]+)/gu)).map((match) => match[2]);
  return tagService.normalizeTags([...frontmatterTags, ...inlineTags]);
}

export function headingsFromMarkdown(markdown: string): string[] {
  return markdown.split(/\r?\n/).map((line) => /^#{1,6}\s+(.+)$/.exec(line)?.[1]?.trim()).filter((value): value is string => Boolean(value));
}

export function excerptFromMarkdown(markdown: string, limit = 240): string {
  const withoutFrontmatter = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---/, "");
  const withoutCode = withoutFrontmatter.replace(/```[\s\S]*?```/g, " ");
  const text = withoutCode.replace(/[#>*_`\[\]()!-]/g, " ").replace(/\s+/g, " ").trim();
  return text.slice(0, limit);
}

function dateFromStat(path: string): { created_at: string; updated_at: string } {
  const stat = statSync(path);
  return { created_at: new Date(stat.ctimeMs).toISOString(), updated_at: new Date(stat.mtimeMs).toISOString() };
}

function openUri(connector: VaultConnector, rootPath: string, absolutePath: string): string {
  const relativePath = connectorService.normalizePath(relative(rootPath, absolutePath));
  return connectorService.obsidianOpenUri(connector.vaultName || connector.displayName, relativePath);
}

function applyDefaultCollections(connector: VaultConnector, collections: string[]): string[] {
  return collectionService.normalizeCollections([...(connector.enableDefaultCollections ? connector.defaultCollections ?? [] : []), ...collections]);
}

export class ResourceVaultConnector implements ConnectorProvider {
  readonly role = "resources" as const;
  private readonly deserializer = new ResourceDeserializer();

  scan(connector: VaultConnector, rootPath: string): ExternalResourceReference[] {
    return walkConnectorFiles(rootPath, connector).flatMap((absolutePath) => {
      if (!absolutePath.toLowerCase().endsWith(".md")) {
        return [];
      }
      const markdown = readFileSync(absolutePath, "utf8");
      const parsed = this.deserializer.deserialize(markdown, absolutePath);
      if (!parsed) {
        return [];
      }
      const relativePath = connectorService.normalizePath(relative(rootPath, absolutePath));
      return [{
        connector_id: connector.id,
        vault_name: connector.vaultName || connector.displayName,
        role: connector.role,
        external_path: relativePath,
        note_title: parsed.resource.title,
        resource_type: parsed.resource.type,
        source_platform: parsed.resource.source,
        tags: parsed.resource.tags,
        collections: applyDefaultCollections(connector, parsed.resource.collections ?? []),
        created_at: parsed.resource.createdAt,
        updated_at: parsed.resource.updatedAt,
        open_uri: openUri(connector, rootPath, absolutePath),
        excerpt: excerptFromMarkdown(markdown),
        metadata: { ...parsed.resource.metadata, resourceId: parsed.resource.id, url: parsed.resource.url, filePath: parsed.resource.filePath }
      }];
    });
  }
}

export class ConversationVaultConnector implements ConnectorProvider {
  readonly role = "conversations" as const;

  scan(connector: VaultConnector, rootPath: string): ExternalResourceReference[] {
    return walkConnectorFiles(rootPath, connector).flatMap((absolutePath) => {
      if (!absolutePath.toLowerCase().endsWith(".md")) {
        return [];
      }
      const markdown = readFileSync(absolutePath, "utf8");
      const frontmatter = splitFrontmatter(markdown);
      const relativePath = connectorService.normalizePath(relative(rootPath, absolutePath));
      const headings = headingsFromMarkdown(markdown);
      const platform = inferConversationPlatform(relativePath, frontmatter);
      const dates = dateFromStat(absolutePath);
      return [{
        connector_id: connector.id,
        vault_name: connector.vaultName || connector.displayName,
        role: connector.role,
        external_path: relativePath,
        note_title: String(frontmatter.title || headings[0] || relativePath.split("/").pop()?.replace(/\.md$/i, "") || "Conversation"),
        resource_type: isMoc(relativePath, markdown) ? "moc" : "conversation",
        source_platform: platform,
        tags: tagsFromMarkdown(markdown, frontmatter),
        collections: applyDefaultCollections(connector, []),
        created_at: typeof frontmatter.created === "string" ? frontmatter.created : dates.created_at,
        updated_at: typeof frontmatter.updated === "string" ? frontmatter.updated : dates.updated_at,
        open_uri: openUri(connector, rootPath, absolutePath),
        excerpt: excerptFromMarkdown(markdown),
        metadata: { headings, platform, moc: isMoc(relativePath, markdown) }
      }];
    });
  }
}

export class DocumentVaultConnector implements ConnectorProvider {
  readonly role = "documents" as const;

  scan(connector: VaultConnector, rootPath: string): ExternalResourceReference[] {
    return walkConnectorFiles(rootPath, connector).map((absolutePath) => {
      const relativePath = connectorService.normalizePath(relative(rootPath, absolutePath));
      const extension = FileResourceService.extensionFromPath(relativePath) ?? "md";
      const isMarkdown = extension === "md";
      const markdown = isMarkdown ? readFileSync(absolutePath, "utf8") : "";
      const frontmatter = isMarkdown ? splitFrontmatter(markdown) : {};
      const dates = dateFromStat(absolutePath);
      return {
        connector_id: connector.id,
        vault_name: connector.vaultName || connector.displayName,
        role: connector.role,
        external_path: relativePath,
        note_title: String(frontmatter.title || FileResourceService.filenameFromPath(relativePath).replace(/\.[^.]+$/, "")),
        resource_type: isMarkdown ? "document" : FileResourceService.detectType(relativePath, undefined, "other"),
        source_platform: "vault-file",
        tags: isMarkdown ? tagsFromMarkdown(markdown, frontmatter) : [],
        collections: applyDefaultCollections(connector, []),
        created_at: dates.created_at,
        updated_at: dates.updated_at,
        open_uri: isMarkdown ? openUri(connector, rootPath, absolutePath) : relativePath,
        excerpt: isMarkdown ? excerptFromMarkdown(markdown) : "",
        metadata: { extension, fileSizeBytes: statSync(absolutePath).size }
      };
    });
  }
}

export function inferConversationPlatform(relativePath: string, frontmatter: Record<string, unknown> = {}): string {
  const override = frontmatter.platform || frontmatter.source_platform;
  if (typeof override === "string" && override.trim()) {
    return override.trim();
  }
  const lower = relativePath.toLowerCase();
  if (lower.includes("chatgpt") || lower.includes("openai")) {
    return "ChatGPT";
  }
  if (lower.includes("claude")) {
    return "Claude";
  }
  if (lower.includes("gemini")) {
    return "Gemini";
  }
  return "Conversation";
}

export function isMoc(relativePath: string, markdown: string): boolean {
  return /(^|[\s/_-])moc([\s/_-]|\.|$)/i.test(relativePath) || /map of content|index of notes/i.test(markdown);
}


