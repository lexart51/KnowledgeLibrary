export type KnowledgeResourceType = "youtube" | "website" | "pdf" | "book" | "powerpoint" | "document" | "markdown" | "image" | "script" | "skill" | "archive" | "file" | "other";

export type KnowledgeResourceStatus = "active" | "archived" | "unavailable";

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
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
