import KnowledgeLibraryPlugin from "../main";
import { KnowledgeResource } from "../models/KnowledgeResource";
import { ConnectorStatus, ExternalResourceReference, UnifiedIndexEntry, UnifiedKnowledgeIndex, VaultConnector } from "../models/VaultConnector";
import { ConversationVaultConnector, DocumentVaultConnector, ResourceVaultConnector } from "../providers/VaultConnectorProviders";
import { CollectionService } from "./CollectionService";
import { TagService } from "./TagService";
import { StoredResource } from "./VaultResourceRepository";
import { VaultAvailabilityService, VaultConnectorService } from "./VaultConnectorService";
import { IndexRepository } from "./PluginStorage/IndexRepository";

export interface UnifiedIndexCounts {
  byConnector: Record<string, number>;
  byRole: Record<string, number>;
  byType: Record<string, number>;
  byVault: Record<string, number>;
  byPlatform: Record<string, number>;
}


export class UnifiedIndexService {
  private providers = {
    resources: new ResourceVaultConnector(),
    conversations: new ConversationVaultConnector(),
    documents: new DocumentVaultConnector(),
    custom: new DocumentVaultConnector()
  };

  constructor(
    private readonly plugin: KnowledgeLibraryPlugin,
    private readonly connectorService = new VaultConnectorService(),
    private readonly availabilityService = new VaultAvailabilityService(connectorService),
    private readonly tagService = new TagService(),
    private readonly collectionService = new CollectionService(),
    private readonly indexRepository: IndexRepository
  ) {}

  async rebuild(): Promise<UnifiedKnowledgeIndex> {
    const activeResources = await this.plugin.resourceRepository.list();
    const entries = activeResources.map((item) => this.fromActiveResource(item));
    const statuses: ConnectorStatus[] = [];
    const errors: Array<{ connector_id: string; message: string }> = [];

    for (const connector of this.plugin.settings.vaultConnectors.map((item) => this.connectorService.normalizeConnector(item))) {
      const status = this.availabilityService.check(connector);
      const currentStatus: ConnectorStatus = { connector, ...status, lastScanAt: connector.lastScanAt ?? null, indexedItemCount: 0 };
      if (!status.available || !status.path) {
        currentStatus.error = status.error;
        statuses.push(currentStatus);
        if (status.error && connector.enabled) {
          errors.push({ connector_id: connector.id, message: status.error });
        }
        continue;
      }

      try {
        const provider = this.providers[connector.role];
        const references = provider.scan(connector, status.path);
        const externalEntries = references.map((reference) => this.fromExternalReference(connector, reference));
        entries.push(...externalEntries);
        currentStatus.available = true;
        currentStatus.error = null;
        currentStatus.lastScanAt = new Date().toISOString();
        currentStatus.indexedItemCount = externalEntries.length;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Connector scan failed.";
        currentStatus.available = false;
        currentStatus.error = message;
        errors.push({ connector_id: connector.id, message });
      }
      statuses.push(currentStatus);
    }

    const index: UnifiedKnowledgeIndex = {
      schema_version: 1,
      rebuilt_at: new Date().toISOString(),
      entries: dedupeEntries(entries),
      connector_statuses: statuses,
      errors
    };
    await this.save(index);
    return index;
  }

  async refresh(): Promise<UnifiedKnowledgeIndex> {
    return this.rebuild();
  }

  async load(): Promise<UnifiedKnowledgeIndex | null> {
    return this.indexRepository.load();
  }

  async save(index: UnifiedKnowledgeIndex): Promise<void> {
    await this.indexRepository.save(index);
  }

  counts(index: UnifiedKnowledgeIndex): UnifiedIndexCounts {
    const counts: UnifiedIndexCounts = { byConnector: {}, byRole: {}, byType: {}, byVault: {}, byPlatform: {} };
    for (const entry of index.entries) {
      increment(counts.byConnector, entry.connector_name);
      increment(counts.byRole, entry.role);
      increment(counts.byType, entry.type);
      increment(counts.byVault, entry.vault_name);
      if (entry.source_platform) {
        increment(counts.byPlatform, entry.source_platform);
      }
    }
    return counts;
  }

  private fromActiveResource(item: StoredResource): UnifiedIndexEntry {
    const resource: KnowledgeResource = item.resource;
    return {
      id: `active:${resource.id}`,
      origin: "active-vault",
      connector_id: "active-vault",
      connector_name: "Active vault",
      vault_name: "Active vault",
      role: "active",
      type: resource.type,
      title: resource.title,
      creator: resource.creator,
      path: item.path,
      url: resource.url,
      open_uri: item.path,
      tags: this.tagService.normalizeTags(resource.tags),
      collections: this.collectionService.normalizeCollections(resource.collections ?? []),
      excerpt: "",
      created_at: resource.createdAt,
      updated_at: resource.updatedAt,
      status: resource.status,
      favorite: resource.favorite,
      completed: resource.completed,
      progress: resource.progress,
      progress_unit: resource.progress_unit,
      priority: resource.priority,
      source_platform: resource.source,
      metadata: resource.metadata
    };
  }

  private fromExternalReference(connector: VaultConnector, reference: ExternalResourceReference): UnifiedIndexEntry {
    return {
      id: `external:${reference.connector_id}:${reference.external_path}`.toLowerCase(),
      origin: "external",
      connector_id: reference.connector_id,
      connector_name: connector.displayName,
      vault_name: reference.vault_name,
      role: reference.role,
      type: reference.resource_type,
      title: reference.note_title,
      creator: typeof reference.metadata.creator === "string" ? reference.metadata.creator : null,
      path: reference.external_path,
      url: typeof reference.metadata.url === "string" ? reference.metadata.url : null,
      open_uri: reference.open_uri,
      tags: this.tagService.normalizeTags(reference.tags),
      collections: this.collectionService.normalizeCollections(reference.collections),
      excerpt: reference.excerpt,
      created_at: reference.created_at,
      updated_at: reference.updated_at,
      source_platform: reference.source_platform ?? null,
      metadata: reference.metadata
    };
  }
}

export class UnifiedSearchService {
  search(index: UnifiedKnowledgeIndex, query: string, filters: Partial<{ connector_id: string; vault_name: string; role: string; type: string }> = {}): UnifiedIndexEntry[] {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return index.entries.filter((entry) => {
      if (filters.connector_id && filters.connector_id !== "all" && entry.connector_id !== filters.connector_id) return false;
      if (filters.vault_name && filters.vault_name !== "all" && entry.vault_name !== filters.vault_name) return false;
      if (filters.role && filters.role !== "all" && entry.role !== filters.role) return false;
      if (filters.type && filters.type !== "all" && entry.type !== filters.type) return false;
      if (terms.length === 0) return true;
      const haystack = [entry.title, entry.creator, entry.tags.join(" "), entry.collections.join(" "), entry.excerpt, entry.source_platform, entry.connector_name, entry.vault_name, entry.type].filter(Boolean).join(" ").toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }
}

export function dedupeEntries(entries: UnifiedIndexEntry[]): UnifiedIndexEntry[] {
  const byKey = new Map<string, UnifiedIndexEntry>();
  for (const entry of entries) {
    const key = `${entry.origin}:${entry.connector_id}:${entry.path.toLowerCase()}`;
    const existing = byKey.get(key);
    if (!existing || (entry.updated_at ?? "") > (existing.updated_at ?? "")) {
      byKey.set(key, entry);
    }
  }
  return Array.from(byKey.values());
}

function increment(record: Record<string, number>, key: string): void {
  record[key] = (record[key] ?? 0) + 1;
}
