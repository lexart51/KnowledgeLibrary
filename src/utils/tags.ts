export function normalizeTag(tag: string): string {
  return tag.trim().replace(/^#/, "").toLowerCase();
}
