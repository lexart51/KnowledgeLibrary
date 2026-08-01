import { KnowledgeResource, KnowledgeResourceRelationship, KnowledgeResourceRelationshipType } from "../models/KnowledgeResource";
import { StoredResource } from "./VaultResourceRepository";

export const RELATIONSHIP_TYPES: KnowledgeResourceRelationshipType[] = [
  "related",
  "complements",
  "contradicts",
  "explains",
  "prerequisite",
  "continuation",
  "source",
  "derived-from"
];

export class RelationshipService {
  normalizeRelationship(relationship: KnowledgeResourceRelationship): KnowledgeResourceRelationship {
    const type = RELATIONSHIP_TYPES.includes(relationship.relationship_type) ? relationship.relationship_type : "related";
    return {
      resource_id: relationship.resource_id.trim(),
      relationship_type: type,
      note: relationship.note.trim()
    };
  }

  addRelationship(resource: KnowledgeResource, relationship: KnowledgeResourceRelationship): KnowledgeResource {
    const normalized = this.normalizeRelationship(relationship);
    if (!normalized.resource_id) {
      throw new Error("Related resource is required.");
    }
    if (normalized.resource_id === resource.id) {
      throw new Error("A resource cannot be related to itself.");
    }

    const existing = resource.related_resources ?? [];
    if (existing.some((item) => this.sameRelationship(item, normalized))) {
      throw new Error("This relationship already exists.");
    }

    return { ...resource, related_resources: [...existing, normalized] };
  }

  removeRelationship(resource: KnowledgeResource, relationship: KnowledgeResourceRelationship): KnowledgeResource {
    const normalized = this.normalizeRelationship(relationship);
    return {
      ...resource,
      related_resources: (resource.related_resources ?? []).filter((item) => !this.sameRelationship(item, normalized))
    };
  }

  outgoing(resource: KnowledgeResource): KnowledgeResourceRelationship[] {
    return resource.related_resources ?? [];
  }

  incoming(resources: StoredResource[], resourceId: string): Array<{ from: KnowledgeResource; relationship: KnowledgeResourceRelationship }> {
    return resources.flatMap((item) => (item.resource.related_resources ?? [])
      .filter((relationship) => relationship.resource_id === resourceId)
      .map((relationship) => ({ from: item.resource, relationship })));
  }

  resolve(resources: StoredResource[], resourceId: string): StoredResource | null {
    return resources.find((item) => item.resource.id === resourceId) ?? null;
  }

  private sameRelationship(left: KnowledgeResourceRelationship, right: KnowledgeResourceRelationship): boolean {
    return left.resource_id === right.resource_id && left.relationship_type === right.relationship_type && left.note.trim() === right.note.trim();
  }
}
