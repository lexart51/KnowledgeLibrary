import { KnowledgeResourcePriority, KnowledgeResourceProgressUnit, KnowledgeResourceStatus, KnowledgeResourceType } from "./KnowledgeResource";

export type VaultConnectorRole = "resources" | "conversations" | "documents" | "custom";

export interface VaultConnector {
  id: string;
  displayName: string;
  role: VaultConnectorRole;
  windowsPath: string;
  linuxPath?: string;
  vaultName?: string;
  enabled: boolean;
  includePatterns: string[];
  excludePatterns: string[];
  preferredNoteType: string;
  icon: string;
  colorToken: string;
  defaultCollections?: string[];
  enableDefaultCollections?: boolean;
  lastScanAt?: string | null;
  lastError?: string | null;
}

export interface ConnectorStatus {
  connector: VaultConnector;
  available: boolean;
  path: string | null;
  vaultName: string;
  error: string | null;
  lastScanAt: string | null;
  indexedItemCount: number;
}

export interface ExternalResourceReference {
  connector_id: string;
  vault_name: string;
  role: VaultConnectorRole;
  external_path: string;
  note_title: string;
  resource_type: KnowledgeResourceType | "conversation" | "moc" | "document";
  source_platform?: string | null;
  tags: string[];
  collections: string[];
  created_at: string | null;
  updated_at: string | null;
  open_uri: string;
  excerpt: string;
  metadata: Record<string, unknown>;
}

export interface UnifiedIndexEntry {
  id: string;
  origin: "active-vault" | "external";
  connector_id: string;
  connector_name: string;
  vault_name: string;
  role: VaultConnectorRole | "active";
  type: string;
  title: string;
  creator: string | null;
  path: string;
  url: string | null;
  open_uri: string;
  tags: string[];
  collections: string[];
  excerpt: string;
  created_at: string | null;
  updated_at: string | null;
  status?: KnowledgeResourceStatus;
  favorite?: boolean;
  completed?: boolean;
  progress?: number;
  progress_unit?: KnowledgeResourceProgressUnit;
  priority?: KnowledgeResourcePriority;
  source_platform?: string | null;
  metadata: Record<string, unknown>;
}

export interface UnifiedKnowledgeIndex {
  schema_version: 1;
  rebuilt_at: string;
  entries: UnifiedIndexEntry[];
  connector_statuses: ConnectorStatus[];
  errors: Array<{ connector_id: string; message: string }>;
}
