import { KnowledgeResource, KnowledgeResourceType, ResourceInput } from "../models/KnowledgeResource";
import { createResourceId } from "./ids";

export function createBaseResource(input: ResourceInput, type: KnowledgeResourceType, seed: string): KnowledgeResource {
  const timestamp = new Date().toISOString();
  const createdAt = input.createdAt ?? timestamp;
  const updatedAt = input.updatedAt ?? createdAt;

  return {
    id: createResourceId(`${type}:${seed}`),
    type,
    title: input.title?.trim() || "Untitled resource",
    creator: input.creator ?? null,
    source: input.source ?? type,
    url: input.url ?? null,
    filePath: input.filePath ?? null,
    thumbnail: input.thumbnail ?? null,
    tags: input.tags ?? [],
    status: input.status ?? "active",
    favorite: input.favorite ?? false,
    completed: input.completed ?? false,
    rating: input.rating ?? null,
    collections: input.collections ?? [],
    progress: input.completed ? 100 : input.progress ?? 0,
    progress_unit: input.progress_unit ?? "percent",
    current_position: input.current_position ?? null,
    total_units: input.total_units ?? null,
    priority: input.priority ?? "normal",
    related_resources: input.related_resources ?? [],
    createdAt,
    updatedAt,
    metadata: input.metadata ?? {}
  };
}
