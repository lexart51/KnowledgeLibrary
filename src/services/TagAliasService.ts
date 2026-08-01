import { StaticTagAliasProvider } from "../providers/StaticTagAliasProvider";
import { normalizeTag } from "../utils/tags";

export class TagAliasService {
  private readonly aliases = new Map<string, string>();

  constructor(provider = new StaticTagAliasProvider()) {
    for (const entry of provider.getAliases()) {
      this.aliases.set(normalizeTag(entry.alias), normalizeTag(entry.canonical));
    }
  }

  canonicalize(tag: string): string {
    const normalized = normalizeTag(tag);
    return this.aliases.get(normalized) ?? normalized;
  }

  getAliasMap(): ReadonlyMap<string, string> {
    return this.aliases;
  }
}
