import { KnowledgeResourceType } from "../models/KnowledgeResource";

const EXTENSION_TYPES = new Map<string, KnowledgeResourceType>([
  ["pdf", "pdf"],
  ["ppt", "powerpoint"],
  ["pptx", "powerpoint"],
  ["doc", "file"],
  ["docx", "file"],
  ["md", "markdown"],
  ["markdown", "markdown"],
  ["png", "image"],
  ["jpg", "image"],
  ["jpeg", "image"],
  ["gif", "image"],
  ["webp", "image"],
  ["svg", "image"],
  ["js", "script"],
  ["ts", "script"],
  ["py", "script"],
  ["rb", "script"],
  ["ps1", "script"],
  ["sh", "script"],
  ["zip", "archive"],
  ["7z", "archive"],
  ["rar", "archive"],
  ["tar", "archive"],
  ["gz", "archive"]
]);

export function extensionFromPath(path: string): string | null {
  const name = path.split(/[\\/]/).pop() ?? path;
  const dotIndex = name.lastIndexOf(".");
  return dotIndex > -1 ? name.slice(dotIndex + 1).toLowerCase() : null;
}

export function detectResourceTypeFromFilePath(path: string, requestedType?: KnowledgeResourceType): KnowledgeResourceType {
  if (requestedType && requestedType !== "file" && requestedType !== "other") {
    return requestedType;
  }

  const extension = extensionFromPath(path);
  return extension ? EXTENSION_TYPES.get(extension) ?? "other" : "other";
}
