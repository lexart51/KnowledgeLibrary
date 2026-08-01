export function createResourceId(seed: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `kl_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
