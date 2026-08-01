import { KnowledgeResource, ResourceInput, ValidationResult } from "../models/KnowledgeResource";
import { FileResourceService } from "../services/FileResourceService";
import { createBaseResource } from "../utils/resources";
import { ResourceProvider } from "./ResourceProvider";

export class FileProvider implements ResourceProvider {
  readonly id = "file";

  canHandle(input: ResourceInput): boolean {
    return Boolean(input.filePath?.trim()) || Boolean(input.url?.startsWith("file://"));
  }

  async createResource(input: ResourceInput): Promise<KnowledgeResource> {
    const filePath = input.filePath ?? input.url?.replace(/^file:\/\//, "") ?? "";
    const normalizedPath = FileResourceService.normalizeVaultPath(filePath);
    const fallbackTitle = FileResourceService.filenameFromPath(normalizedPath);
    const typeInfo = FileResourceService.typeInfo(normalizedPath, input.type);
    const resource = createBaseResource(
      {
        ...input,
        title: input.title ?? fallbackTitle,
        filePath: normalizedPath,
        source: input.source ?? "vault",
        thumbnail: input.thumbnail ?? (typeInfo.type === "image" ? normalizedPath : null),
        metadata: {
          ...input.metadata,
          extension: FileResourceService.extensionFromPath(normalizedPath),
          mimeType: typeInfo.mimeType,
          scriptLanguage: typeInfo.scriptLanguage,
          archiveFormat: typeInfo.archiveFormat,
          documentFormat: typeInfo.documentFormat,
          provider: this.id
        }
      },
      typeInfo.type,
      normalizedPath.toLowerCase()
    );

    return { ...resource, id: FileResourceService.deterministicResourceId(normalizedPath) };
  }

  normalize(resource: KnowledgeResource): KnowledgeResource {
    const filePath = resource.filePath ? FileResourceService.normalizeVaultPath(resource.filePath) : null;
    const typeInfo = filePath ? FileResourceService.typeInfo(filePath, resource.type) : null;
    return {
      ...resource,
      id: filePath ? FileResourceService.deterministicResourceId(filePath) : resource.id,
      type: typeInfo?.type ?? resource.type,
      filePath,
      thumbnail: resource.thumbnail ?? (typeInfo?.type === "image" ? filePath : null),
      source: resource.source || "vault",
      metadata: {
        ...resource.metadata,
        extension: filePath ? FileResourceService.extensionFromPath(filePath) : null,
        mimeType: typeInfo?.mimeType ?? resource.metadata.mimeType ?? null,
        scriptLanguage: typeInfo?.scriptLanguage ?? resource.metadata.scriptLanguage ?? null,
        archiveFormat: typeInfo?.archiveFormat ?? resource.metadata.archiveFormat ?? null,
        documentFormat: typeInfo?.documentFormat ?? resource.metadata.documentFormat ?? null,
        provider: this.id
      }
    };
  }

  validate(resource: KnowledgeResource): ValidationResult {
    return {
      valid: Boolean(resource.filePath),
      errors: resource.filePath ? [] : ["File resources require filePath."]
    };
  }
}
