import { UnifiedIndexEntry, UnifiedKnowledgeIndex } from "../models/VaultConnector";

export type UniversalSearchDisplayMode = "compact" | "comfortable" | "grouped-role" | "grouped-vault" | "grouped-source";
export type UniversalSearchSortMode = "relevance" | "updated" | "added" | "title" | "source" | "vault" | "type" | "priority" | "progress";

export interface ParsedSearchQuery {
  text: string;
  terms: string[];
  phrase: string;
  filters: Record<string, string>;
}

export interface SearchRankingOptions {
  activeVaultBoost: number;
  favoriteBoost: number;
  recentBoost: number;
  duplicateSuppression: boolean;
  resultLimit: number;
  excerptLength: number;
}

export interface UniversalSearchResult {
  entry: UnifiedIndexEntry;
  score: number;
  matchedFields: string[];
  suppressedDuplicates: UnifiedIndexEntry[];
}

export interface SavedKnowledgeSearch {
  id: string;
  name: string;
  query: string;
  displayMode: UniversalSearchDisplayMode;
  sortMode: UniversalSearchSortMode;
  createdAt: string;
  updatedAt: string;
}

const FILTER_KEYS = new Set(["source", "vault", "role", "type", "tag", "collection", "platform", "status", "favorite", "progress", "priority"]);
const PRIORITY_RANK: Record<string, number> = { high: 3, normal: 2, low: 1 };

export class SearchQueryParser {
  parse(query: string): ParsedSearchQuery {
    const filters: Record<string, string> = {};
    const textParts: string[] = [];
    const tokens = query.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];

    for (const token of tokens) {
      const match = /^([a-z_-]+):(.*)$/i.exec(token);
      if (match && FILTER_KEYS.has(match[1].toLowerCase())) {
        filters[match[1].toLowerCase()] = stripQuotes(match[2]).toLowerCase();
      } else {
        textParts.push(stripQuotes(token));
      }
    }

    const text = textParts.join(" ").trim();
    const terms = tokenize(text);
    return { text, terms, phrase: text.toLowerCase(), filters };
  }
}

export class SearchResultScorer {
  score(entry: UnifiedIndexEntry, query: ParsedSearchQuery, options: SearchRankingOptions, unavailableConnectors = new Set<string>()): UniversalSearchResult | null {
    if (!matchesFilters(entry, query.filters)) {
      return null;
    }

    const fields = searchableFields(entry);
    const matchedFields = new Set<string>();
    let score = query.terms.length === 0 ? 1 : 0;
    const title = fields.title;

    if (query.phrase) {
      if (title === query.phrase) add("title", 1000);
      if (title.startsWith(query.phrase)) add("title", 700);
      if (fields.all.includes(query.phrase)) add("phrase", 120);
    }

    for (const term of query.terms) {
      if (fieldTokens(fields.title).includes(term)) add("title", 180);
      if (fields.tags.includes(term)) add("tags", 160);
      if (fields.collections.includes(term)) add("collections", 145);
      if (fields.creator.includes(term)) add("creator", 90);
      if (fields.headings.includes(term)) add("headings", 80);
      if (fields.path.includes(term) || fields.fileName.includes(term)) add("path", 65);
      if (fields.connector.includes(term) || fields.vault.includes(term) || fields.platform.includes(term)) add("source", 55);
      if (fields.excerpt.includes(term)) add("excerpt", 25);
    }

    if (score <= 0 && query.terms.length > 0) {
      return null;
    }

    score += matchedFields.size * 18;
    if (entry.origin === "active-vault") score += options.activeVaultBoost;
    if (entry.favorite) score += options.favoriteBoost;
    if (entry.priority === "high") score += 65;
    if (entry.priority === "low") score -= 10;
    score += recencyBoost(entry.updated_at, options.recentBoost);
    if (unavailableConnectors.has(entry.connector_id)) score -= 250;
    if (entry.status === "unavailable") score -= 100;
    if (matchedFields.size === 1 && matchedFields.has("excerpt")) score -= 40;

    return { entry, score, matchedFields: Array.from(matchedFields).sort(), suppressedDuplicates: [] };

    function add(field: string, value: number): void {
      score += value;
      matchedFields.add(field);
    }
  }
}

export class SearchRankingService {
  private parser = new SearchQueryParser();
  private scorer = new SearchResultScorer();

  search(index: UnifiedKnowledgeIndex, queryText: string, options: SearchRankingOptions, sortMode: UniversalSearchSortMode = "relevance", showDuplicates = false): UniversalSearchResult[] {
    const query = this.parser.parse(queryText);
    const unavailable = new Set(index.connector_statuses.filter((status) => status.connector.enabled && !status.available).map((status) => status.connector.id));
    const scored = index.entries.map((entry) => this.scorer.score(entry, query, options, unavailable)).filter((result): result is UniversalSearchResult => Boolean(result));
    const deduped = showDuplicates || !options.duplicateSuppression ? scored : suppressDuplicates(scored);
    return deduped.sort((left, right) => compareResults(left, right, sortMode)).slice(0, Math.max(1, options.resultLimit));
  }

  parse(query: string): ParsedSearchQuery {
    return this.parser.parse(query);
  }
}

export function suppressDuplicates(results: UniversalSearchResult[]): UniversalSearchResult[] {
  const byKey = new Map<string, UniversalSearchResult>();
  for (const result of results) {
    const key = duplicateKey(result.entry);
    const existing = byKey.get(key);
    if (!existing || compareResults(result, existing, "relevance") < 0) {
      if (existing) result.suppressedDuplicates.push(existing.entry, ...existing.suppressedDuplicates);
      byKey.set(key, result);
    } else {
      existing.suppressedDuplicates.push(result.entry);
    }
  }
  return Array.from(byKey.values());
}

export function highlightMatchedTerms(text: string, terms: string[]): string {
  let output = escapeHtml(text);
  for (const term of terms.filter(Boolean).sort((a, b) => b.length - a.length)) {
    const escaped = escapeRegex(escapeHtml(term));
    output = output.replace(new RegExp(`(${escaped})`, "gi"), '<mark class="knowledge-library-search-mark">$1</mark>');
  }
  return output;
}

function matchesFilters(entry: UnifiedIndexEntry, filters: Record<string, string>): boolean {
  if (filters.source && !entry.connector_name.toLowerCase().includes(filters.source) && entry.connector_id.toLowerCase() !== filters.source) return false;
  if (filters.vault && !entry.vault_name.toLowerCase().includes(filters.vault)) return false;
  if (filters.role && entry.role.toLowerCase() !== filters.role) return false;
  if (filters.type && entry.type.toLowerCase() !== filters.type) return false;
  if (filters.tag && !entry.tags.map((tag) => tag.toLowerCase()).includes(filters.tag)) return false;
  if (filters.collection && !entry.collections.some((collection) => collection.toLowerCase() === filters.collection)) return false;
  if (filters.platform && (entry.source_platform ?? "").toLowerCase() !== filters.platform) return false;
  if (filters.status && (entry.status ?? "active").toLowerCase() !== filters.status) return false;
  if (filters.favorite && String(Boolean(entry.favorite)) !== filters.favorite) return false;
  if (filters.priority && (entry.priority ?? "normal") !== filters.priority) return false;
  if (filters.progress && progressBucket(entry) !== filters.progress) return false;
  return true;
}

function searchableFields(entry: UnifiedIndexEntry): Record<string, string> {
  const metadataText = Object.values(entry.metadata ?? {}).filter((value) => typeof value === "string" || typeof value === "number" || typeof value === "boolean").join(" ").toLowerCase();
  const headings = Array.isArray(entry.metadata?.headings) ? entry.metadata.headings.filter((value): value is string => typeof value === "string").join(" ").toLowerCase() : "";
  const fileName = String(entry.metadata?.filename ?? entry.path.split("/").pop() ?? "").toLowerCase();
  const fields = {
    title: entry.title.toLowerCase(),
    creator: (entry.creator ?? "").toLowerCase(),
    tags: entry.tags.join(" ").toLowerCase(),
    collections: entry.collections.join(" ").toLowerCase(),
    excerpt: entry.excerpt.toLowerCase(),
    headings,
    connector: entry.connector_name.toLowerCase(),
    vault: entry.vault_name.toLowerCase(),
    platform: (entry.source_platform ?? "").toLowerCase(),
    type: entry.type.toLowerCase(),
    path: entry.path.toLowerCase(),
    fileName,
    metadata: metadataText,
    all: ""
  };
  fields.all = Object.values(fields).join(" ");
  return fields;
}

function duplicateKey(entry: UnifiedIndexEntry): string {
  const metadata = entry.metadata ?? {};
  const resourceId = typeof metadata.resourceId === "string" ? metadata.resourceId : "";
  const videoId = typeof metadata.videoId === "string" ? metadata.videoId : "";
  const url = entry.url?.toLowerCase().replace(/^https?:\/\/(www\.)?/, "") ?? "";
  const filePath = typeof metadata.filePath === "string" ? metadata.filePath.toLowerCase() : "";
  if (resourceId) return `resource:${resourceId}`;
  if (videoId) return `youtube:${videoId}`;
  if (url) return `url:${url}`;
  if (filePath) return `file:${filePath}`;
  return `note:${entry.connector_id}:${entry.path.toLowerCase()}`;
}

function compareResults(left: UniversalSearchResult, right: UniversalSearchResult, sortMode: UniversalSearchSortMode): number {
  if (sortMode === "updated") return compareDates(right.entry.updated_at, left.entry.updated_at) || stable(left, right);
  if (sortMode === "added") return compareDates(right.entry.created_at, left.entry.created_at) || stable(left, right);
  if (sortMode === "title") return left.entry.title.localeCompare(right.entry.title) || stable(left, right);
  if (sortMode === "source") return left.entry.connector_name.localeCompare(right.entry.connector_name) || stable(left, right);
  if (sortMode === "vault") return left.entry.vault_name.localeCompare(right.entry.vault_name) || stable(left, right);
  if (sortMode === "type") return left.entry.type.localeCompare(right.entry.type) || stable(left, right);
  if (sortMode === "priority") return (PRIORITY_RANK[right.entry.priority ?? "normal"] - PRIORITY_RANK[left.entry.priority ?? "normal"]) || stable(left, right);
  if (sortMode === "progress") return ((right.entry.progress ?? 0) - (left.entry.progress ?? 0)) || stable(left, right);
  return (right.score - left.score) || stable(left, right);
}

function stable(left: UniversalSearchResult, right: UniversalSearchResult): number {
  return left.entry.id.localeCompare(right.entry.id) || left.entry.path.localeCompare(right.entry.path);
}

function compareDates(left: string | null, right: string | null): number {
  return (left ?? "").localeCompare(right ?? "");
}

function recencyBoost(date: string | null, maxBoost: number): number {
  if (!date || maxBoost <= 0) return 0;
  const ageDays = Math.max(0, (Date.now() - Date.parse(date)) / 86400000);
  if (!Number.isFinite(ageDays)) return 0;
  return Math.max(0, maxBoost - Math.min(maxBoost, ageDays / 7));
}

function progressBucket(entry: UnifiedIndexEntry): string {
  const progress = entry.progress ?? (entry.completed ? 100 : 0);
  if (entry.completed || progress >= 100) return "completed";
  if (progress > 0) return "in-progress";
  return "not-started";
}

function fieldTokens(value: string): string[] {
  return value.split(/[^\p{L}\p{N}_-]+/u).map((term) => term.trim()).filter(Boolean);
}
function tokenize(value: string): string[] {
  return value.toLowerCase().split(/\s+/).map((term) => term.trim()).filter(Boolean);
}

function stripQuotes(value: string): string {
  return value.replace(/^"|"$/g, "");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
