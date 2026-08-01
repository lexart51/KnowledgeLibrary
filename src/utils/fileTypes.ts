import { KnowledgeResourceType } from "../models/KnowledgeResource";
import { FileResourceService } from "../services/FileResourceService";

export function extensionFromPath(path: string): string | null {
  return FileResourceService.extensionFromPath(path);
}

export function detectResourceTypeFromFilePath(path: string, requestedType?: KnowledgeResourceType, defaultUnknown: KnowledgeResourceType = "other"): KnowledgeResourceType {
  return FileResourceService.detectType(path, requestedType, defaultUnknown);
}
