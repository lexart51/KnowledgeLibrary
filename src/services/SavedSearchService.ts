import KnowledgeLibraryPlugin from "../main";
import { SavedKnowledgeSearch, UniversalSearchDisplayMode, UniversalSearchSortMode } from "./SearchRankingService";

const SAVED_SEARCHES_KEY = "savedKnowledgeSearches";

export class SavedSearchService {
  constructor(private readonly plugin: KnowledgeLibraryPlugin) {}

  async list(): Promise<SavedKnowledgeSearch[]> {
    const data = await this.plugin.loadData() as Record<string, unknown> | null;
    const value = data?.[SAVED_SEARCHES_KEY];
    return Array.isArray(value) ? value as SavedKnowledgeSearch[] : [];
  }

  async save(search: Omit<SavedKnowledgeSearch, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<SavedKnowledgeSearch> {
    const existing = await this.list();
    const now = new Date().toISOString();
    const current = existing.find((item) => item.id === search.id);
    const saved: SavedKnowledgeSearch = {
      id: search.id ?? `search-${Date.now()}`,
      name: search.name.trim() || search.query.trim() || "Untitled search",
      query: search.query,
      displayMode: search.displayMode,
      sortMode: search.sortMode,
      createdAt: current?.createdAt ?? now,
      updatedAt: now
    };
    await this.write([saved, ...existing.filter((item) => item.id !== saved.id)]);
    return saved;
  }

  async remove(id: string): Promise<void> {
    await this.write((await this.list()).filter((item) => item.id !== id));
  }

  private async write(searches: SavedKnowledgeSearch[]): Promise<void> {
    const data = (await this.plugin.loadData() as Record<string, unknown> | null) ?? {};
    await this.plugin.saveData({ ...data, [SAVED_SEARCHES_KEY]: searches });
  }
}

export function serializeSavedSearch(name: string, query: string, displayMode: UniversalSearchDisplayMode, sortMode: UniversalSearchSortMode): Omit<SavedKnowledgeSearch, "id" | "createdAt" | "updatedAt"> {
  return { name, query, displayMode, sortMode };
}
