import { KnowledgeResource } from "../models/KnowledgeResource";

export class ResourceCache {
  private readonly resources = new Map<string, KnowledgeResource>();

  get(id: string): KnowledgeResource | undefined {
    return this.resources.get(id);
  }

  set(resource: KnowledgeResource): void {
    this.resources.set(resource.id, resource);
  }

  values(): KnowledgeResource[] {
    return Array.from(this.resources.values());
  }

  clear(): void {
    this.resources.clear();
  }
}
