import { KnowledgeResource } from "../models/KnowledgeResource";
import { StoredResource, VaultResourceRepository } from "./VaultResourceRepository";

export interface CollectionSummary {
  name: string;
  count: number;
}

export interface CollectionBulkChange {
  path: string;
  resourceId: string;
  title: string;
  before: string[];
  after: string[];
}

export interface CollectionBulkPlan {
  operation: "rename" | "merge";
  from: string[];
  to: string;
  changes: CollectionBulkChange[];
}

export class CollectionService {
  normalizeCollectionName(name: string): string {
    return name.trim().replace(/\s+/g, " ");
  }

  normalizeCollections(collections: string[] = []): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const value of collections) {
      const normalized = this.normalizeCollectionName(value);
      const key = normalized.toLowerCase();
      if (normalized && !seen.has(key)) {
        seen.add(key);
        result.push(normalized);
      }
    }

    return result.sort((left, right) => left.localeCompare(right));
  }

  collectionCounts(resources: StoredResource[]): CollectionSummary[] {
    const counts = new Map<string, number>();
    for (const item of resources) {
      for (const collection of this.normalizeCollections(item.resource.collections ?? [])) {
        counts.set(collection, (counts.get(collection) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  listResourcesByCollection(resources: StoredResource[], collection: string): StoredResource[] {
    const normalized = this.normalizeCollectionName(collection).toLowerCase();
    return resources.filter((item) => this.normalizeCollections(item.resource.collections ?? []).some((value) => value.toLowerCase() === normalized));
  }

  removeResourceFromCollection(resource: KnowledgeResource, collection: string): KnowledgeResource {
    const normalized = this.normalizeCollectionName(collection).toLowerCase();
    return {
      ...resource,
      collections: this.normalizeCollections(resource.collections ?? []).filter((value) => value.toLowerCase() !== normalized)
    };
  }

  planRename(resources: StoredResource[], from: string, to: string): CollectionBulkPlan {
    const normalizedFrom = this.normalizeCollectionName(from);
    const normalizedTo = this.normalizeCollectionName(to);
    this.assertUniqueTarget(resources, [normalizedFrom], normalizedTo);
    return this.plan(resources, "rename", [normalizedFrom], normalizedTo);
  }

  planMerge(resources: StoredResource[], from: string[], to: string): CollectionBulkPlan {
    const normalizedFrom = this.normalizeCollections(from);
    const normalizedTo = this.normalizeCollectionName(to);
    return this.plan(resources, "merge", normalizedFrom, normalizedTo);
  }

  async applyPlan(plan: CollectionBulkPlan, repository: VaultResourceRepository): Promise<CollectionBulkPlan> {
    for (const change of plan.changes) {
      const stored = await repository.findByResourceId(change.resourceId);
      if (stored) {
        await repository.update(stored.path, { ...stored.resource, collections: change.after });
      }
    }

    return plan;
  }

  private plan(resources: StoredResource[], operation: "rename" | "merge", from: string[], to: string): CollectionBulkPlan {
    const fromKeys = new Set(from.map((value) => value.toLowerCase()));
    const changes = resources.flatMap((item) => {
      const before = this.normalizeCollections(item.resource.collections ?? []);
      if (!before.some((collection) => fromKeys.has(collection.toLowerCase()))) {
        return [];
      }

      const after = this.normalizeCollections(before.map((collection) => fromKeys.has(collection.toLowerCase()) ? to : collection));
      return [{ path: item.path, resourceId: item.resource.id, title: item.resource.title, before, after }];
    });

    return { operation, from, to, changes };
  }

  private assertUniqueTarget(resources: StoredResource[], from: string[], to: string): void {
    const fromKeys = new Set(from.map((value) => value.toLowerCase()));
    const targetKey = to.toLowerCase();
    const exists = this.collectionCounts(resources).some((item) => item.name.toLowerCase() === targetKey && !fromKeys.has(item.name.toLowerCase()));
    if (exists) {
      throw new Error(`Collection already exists after normalization: ${to}`);
    }
  }
}
