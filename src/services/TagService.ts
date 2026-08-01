import { TagAliasService } from "./TagAliasService";

export class TagService {
  constructor(private readonly tagAliases = new TagAliasService()) {}

  normalizeTags(tags: readonly string[] = []): string[] {
    const normalizedTags = new Set<string>();

    for (const tag of tags) {
      const normalized = this.tagAliases.canonicalize(tag);
      if (normalized.length > 0) {
        normalizedTags.add(normalized);
      }
    }

    return Array.from(normalizedTags);
  }
}
