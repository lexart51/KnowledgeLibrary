export type KnowledgeResourceType = "youtube" | "website" | "pdf" | "book" | "powerpoint" | "document" | "markdown" | "image" | "script" | "skill" | "archive" | "file" | "other";

export type KnowledgeResourceStatus = "active" | "archived" | "unavailable";
export type KnowledgeResourceProgressUnit = "percent" | "pages" | "slides" | "chapters" | "minutes" | "custom";
export type KnowledgeResourcePriority = "low" | "normal" | "high";
export type KnowledgeResourceRelationshipType = "related" | "complements" | "contradicts" | "explains" | "prerequisite" | "continuation" | "source" | "derived-from";

export interface KnowledgeResourceRelationship {
  resource_id: string;
  relationship_type: KnowledgeResourceRelationshipType;
  note: string;
}

export interface KnowledgeResourceMetadata {
  [key: string]: unknown;
}

export interface KnowledgeResource {
  id: string;
  type: KnowledgeResourceType;
  title: string;
  creator: string | null;
  source: string;
  url: string | null;
  filePath: string | null;
  thumbnail: string | null;
  tags: string[];
  status: KnowledgeResourceStatus;
  favorite: boolean;
  completed: boolean;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
  metadata: KnowledgeResourceMetadata;
  collections?: string[];
  progress?: number;
  progress_unit?: KnowledgeResourceProgressUnit;
  current_position?: number | null;
  total_units?: number | null;
  priority?: KnowledgeResourcePriority;
  related_resources?: KnowledgeResourceRelationship[];
}

export interface ResourceInput {
  type?: KnowledgeResourceType;
  title?: string;
  creator?: string | null;
  source?: string;
  url?: string | null;
  filePath?: string | null;
  thumbnail?: string | null;
  tags?: string[];
  status?: KnowledgeResourceStatus;
  favorite?: boolean;
  completed?: boolean;
  rating?: number | null;
  createdAt?: string;
  updatedAt?: string;
  metadata?: KnowledgeResourceMetadata;
  collections?: string[];
  progress?: number;
  progress_unit?: KnowledgeResourceProgressUnit;
  current_position?: number | null;
  total_units?: number | null;
  priority?: KnowledgeResourcePriority;
  related_resources?: KnowledgeResourceRelationship[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
