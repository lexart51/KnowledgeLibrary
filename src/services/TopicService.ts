import { UnifiedIndexEntry } from "../models/VaultConnector";
import { duplicateKeys } from "./SearchRankingService";

export type TopicSortMode = "popular" | "recent" | "title";

export interface TopicCounts {
  videos: number;
  conversations: number;
  documents: number;
  resources: number;
  collections: number;
}

export interface TopicTimelineItem {
  date: string;
  label: string;
  entry: UnifiedIndexEntry;
}

export interface TopicSummary {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  aliases: string[];
  entries: UnifiedIndexEntry[];
  counts: TopicCounts;
  progress: number;
  relatedTopics: Array<{ topic: string; count: number }>;
  timeline: TopicTimelineItem[];
  continueLearning: UnifiedIndexEntry[];
  score: number;
  updated_at: string | null;
}

const STOP_WORDS = new Set([
  "and", "the", "for", "with", "from", "into", "onto", "this", "that", "what", "when", "where", "your", "how", "why",
  "uma", "para", "como", "com", "dos", "das", "que", "por", "sem", "sobre", "aula", "note", "notes", "resource", "document"
]);

export class TopicService {
  discoverTopics(entries: UnifiedIndexEntry[], sortMode: TopicSortMode = "popular", limit = 200): TopicSummary[] {
    const uniqueEntries = suppressHomeDuplicates(entries);
    const byTopic = new Map<string, { name: string; aliases: Set<string>; entries: UnifiedIndexEntry[] }>();

    for (const entry of uniqueEntries) {
      const candidates = discoverTopicCandidates(entry);
      for (const candidate of candidates) {
        const id = topicId(candidate);
        if (!id) continue;
        const existing = byTopic.get(id) ?? { name: displayTopic(candidate), aliases: new Set<string>(), entries: [] };
        existing.aliases.add(candidate);
        if (candidate === candidates[0]) {
          for (const alias of topicAliasesForEntry(entry)) existing.aliases.add(alias);
        }
        existing.entries.push(entry);
        byTopic.set(id, existing);
      }
    }

    const summaries = Array.from(byTopic.entries()).map(([id, item]) => this.summarize(id, item.name, Array.from(item.aliases), item.entries));
    return summaries.sort((left, right) => compareTopics(left, right, sortMode)).slice(0, limit);
  }

  findTopic(entries: UnifiedIndexEntry[], topicName: string): TopicSummary | null {
    const id = topicId(topicName);
    return this.discoverTopics(entries, "popular", 1000).find((topic) => topic.id === id || topic.aliases.some((alias) => topicId(alias) === id)) ?? null;
  }

  searchTopics(entries: UnifiedIndexEntry[], query: string, limit = 5): TopicSummary[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return this.discoverTopics(entries, "popular", limit);
    return this.discoverTopics(entries, "popular", 1000)
      .filter((topic) => topic.name.toLowerCase().includes(normalized) || topic.aliases.some((alias) => alias.toLowerCase().includes(normalized)))
      .sort((left, right) => topicSearchScore(right, normalized) - topicSearchScore(left, normalized) || left.name.localeCompare(right.name))
      .slice(0, limit);
  }

  popularTopics(entries: UnifiedIndexEntry[], limit = 8): TopicSummary[] {
    return this.discoverTopics(entries, "popular", limit);
  }

  entriesForTopic(entries: UnifiedIndexEntry[], topicName: string): UnifiedIndexEntry[] {
    const id = topicId(topicName);
    return suppressHomeDuplicates(entries).filter((entry) => discoverTopicCandidates(entry).some((candidate) => topicId(candidate) === id));
  }

  private summarize(id: string, name: string, aliases: string[], entries: UnifiedIndexEntry[]): TopicSummary {
    const uniqueEntries = suppressHomeDuplicates(entries);
    const collections = new Set(uniqueEntries.flatMap((entry) => entry.collections.map((collection) => topicId(collection))));
    const counts: TopicCounts = {
      videos: uniqueEntries.filter((entry) => entry.type === "youtube").length,
      conversations: uniqueEntries.filter((entry) => entry.role === "conversations").length,
      documents: uniqueEntries.filter((entry) => entry.role === "documents" || entry.type === "document" || entry.type === "pdf").length,
      resources: uniqueEntries.filter((entry) => entry.role === "resources" || entry.role === "active").length,
      collections: collections.size
    };
    const progressValues = uniqueEntries.map((entry) => entry.progress ?? (entry.completed ? 100 : 0)).filter((value) => value > 0);
    const progress = progressValues.length > 0 ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length) : 0;
    const updated_at = latestDate(uniqueEntries.map((entry) => activityDate(entry)));
    const relatedTopics = relatedTopicCounts(name, uniqueEntries).slice(0, 12);
    const timeline = topicTimeline(uniqueEntries, 20);
    const continueLearning = continueLearningTopicEntries(uniqueEntries, 8);
    const description = firstString(uniqueEntries.map((entry) => entry.metadata.topic_description ?? entry.metadata.description ?? entry.excerpt));
    const score = uniqueEntries.length * 10 + counts.conversations * 4 + counts.documents * 3 + counts.videos * 3 + recencyScore(updated_at);
    return { id, name, icon: topicIcon(name, counts), description, aliases: Array.from(new Set(aliases)).sort(), entries: uniqueEntries, counts, progress, relatedTopics, timeline, continueLearning, score, updated_at };
  }
}

export function primaryTopicForEntry(entry: UnifiedIndexEntry): string | null {
  return discoverTopicCandidates(entry)[0] ?? null;
}
export function discoverTopicCandidates(entry: UnifiedIndexEntry): string[] {
  const metadata = entry.metadata ?? {};
  return Array.from(new Set([
    ...entry.tags,
    ...entry.collections,
    ...stringList(metadata.aliases),
    ...stringList(metadata.topicAliases),
    ...stringList(metadata.topics),
    ...relationshipTopicHints(metadata.related_resources),
    ...titleTopics(entry.title),
    ...stringList(metadata.headings).flatMap(titleTopics)
  ].map((value) => displayTopic(value)).filter(Boolean)));
}

export function topicId(value: string): string {
  return displayTopic(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function topicTimeline(entries: UnifiedIndexEntry[], limit: number): TopicTimelineItem[] {
  return suppressHomeDuplicates(entries)
    .map((entry) => ({ entry, date: activityDate(entry), label: timelineLabel(entry) }))
    .filter((item) => Boolean(item.date))
    .sort((left, right) => right.date.localeCompare(left.date) || left.entry.title.localeCompare(right.entry.title))
    .slice(0, limit);
}

function topicAliasesForEntry(entry: UnifiedIndexEntry): string[] {
  const metadata = entry.metadata ?? {};
  return [
    ...stringList(metadata.aliases),
    ...stringList(metadata.topicAliases),
    ...stringList(metadata.topics)
  ].map((value) => displayTopic(value)).filter(Boolean);
}
function relatedTopicCounts(topicName: string, entries: UnifiedIndexEntry[]): Array<{ topic: string; count: number }> {
  const currentId = topicId(topicName);
  const counts = new Map<string, { topic: string; count: number }>();
  for (const entry of entries) {
    for (const candidate of discoverTopicCandidates(entry)) {
      const id = topicId(candidate);
      if (!id || id === currentId) continue;
      const existing = counts.get(id) ?? { topic: displayTopic(candidate), count: 0 };
      existing.count += 1;
      counts.set(id, existing);
    }
  }
  return Array.from(counts.values()).sort((left, right) => right.count - left.count || left.topic.localeCompare(right.topic));
}

function titleTopics(title: string): string[] {
  const words = title.match(/[A-Za-z][A-Za-z0-9+#.-]{2,}/g) ?? [];
  return words.filter((word) => !STOP_WORDS.has(word.toLowerCase()) && (word[0] === word[0].toUpperCase() || /[A-Z]{2,}|\d/.test(word))).slice(0, 6);
}

function relationshipTopicHints(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    return [record.note, record.resource_id].filter((candidate): candidate is string => typeof candidate === "string");
  }).flatMap(titleTopics);
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function displayTopic(value: string): string {
  return value.replace(/^#/, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function firstString(values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 220);
  }
  return null;
}

function activityDate(entry: UnifiedIndexEntry): string {
  const opened = typeof entry.metadata.lastOpened === "string" ? entry.metadata.lastOpened : typeof entry.metadata.last_opened === "string" ? entry.metadata.last_opened : null;
  return validDate(opened) ?? validDate(entry.updated_at) ?? validDate(entry.created_at) ?? "";
}

function validDate(value: string | null): string | null {
  return value && Number.isFinite(Date.parse(value)) ? value : null;
}

function latestDate(values: string[]): string | null {
  return values.filter(Boolean).sort().at(-1) ?? null;
}

function timelineLabel(entry: UnifiedIndexEntry): string {
  if (entry.progress && entry.progress > 0) return "Progress updated";
  if (entry.role === "conversations") return "Conversation created";
  if (entry.role === "documents") return "Document updated";
  if (entry.collections.length > 0) return "Collection created";
  return entry.type === "youtube" ? "Video added" : "Resource updated";
}

function topicIcon(name: string, counts: TopicCounts): string {
  if (/claude|gemini|openrouter|deepseek|ai|mcp|agent/i.test(name)) return "sparkles";
  if (counts.videos > 0 && counts.videos >= counts.documents) return "play-circle";
  if (counts.conversations > 0) return "messages-square";
  if (counts.documents > 0) return "files";
  return "network";
}

function recencyScore(value: string | null): number {
  if (!value) return 0;
  const ageDays = Math.max(0, (Date.now() - Date.parse(value)) / 86400000);
  return Math.max(0, 20 - Math.min(20, ageDays));
}

function compareTopics(left: TopicSummary, right: TopicSummary, sortMode: TopicSortMode): number {
  if (sortMode === "title") return left.name.localeCompare(right.name);
  if (sortMode === "recent") return (right.updated_at ?? "").localeCompare(left.updated_at ?? "") || left.name.localeCompare(right.name);
  return right.score - left.score || left.name.localeCompare(right.name);
}

function topicSearchScore(topic: TopicSummary, query: string): number {
  const name = topic.name.toLowerCase();
  if (name === query) return 10000 + topic.score;
  if (name.startsWith(query)) return 5000 + topic.score;
  return topic.score;
}
function suppressHomeDuplicates(entries: UnifiedIndexEntry[]): UnifiedIndexEntry[] {
  const byKey = new Map<string, UnifiedIndexEntry>();
  for (const entry of entries) {
    const keys = duplicateKeys(entry);
    const existing = keys.map((key) => byKey.get(key)).find((item): item is UnifiedIndexEntry => Boolean(item));
    if (!existing || compareEntryPreference(entry, existing) < 0) {
      if (existing) {
        for (const existingKey of duplicateKeys(existing)) {
          if (byKey.get(existingKey) === existing) byKey.delete(existingKey);
        }
      }
      for (const key of keys) byKey.set(key, entry);
    }
  }
  return Array.from(new Set(byKey.values()));
}

function continueLearningTopicEntries(entries: UnifiedIndexEntry[], limit: number): UnifiedIndexEntry[] {
  return suppressHomeDuplicates(entries)
    .filter((entry) => {
      const progress = entry.progress ?? (entry.completed ? 100 : 0);
      if (entry.completed || progress >= 100) return false;
      if (progress > 0 && progress < 100) return true;
      if (numberValue(entry.metadata.current_position, entry.metadata.currentPosition) > 0 && numberValue(entry.metadata.total_units, entry.metadata.totalUnits) > 0) return true;
      if (validDate(typeof entry.metadata.lastOpened === "string" ? entry.metadata.lastOpened : typeof entry.metadata.last_opened === "string" ? entry.metadata.last_opened : null)) return true;
      return entry.priority === "high";
    })
    .sort((left, right) => (right.progress ?? 0) - (left.progress ?? 0) || compareEntryPreference(left, right))
    .slice(0, limit);
}

function compareEntryPreference(left: UnifiedIndexEntry, right: UnifiedIndexEntry): number {
  return Number(right.origin === "active-vault") - Number(left.origin === "active-vault")
    || activityDate(right).localeCompare(activityDate(left))
    || left.title.localeCompare(right.title)
    || left.id.localeCompare(right.id);
}

function numberValue(...values: unknown[]): number {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
}
