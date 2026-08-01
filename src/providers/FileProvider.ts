import { KnowledgeResource, ResourceInput, ValidationResult } from "../models/KnowledgeResource";
import { detectResourceTypeFromFilePath, extensionFromPath } from "../utils/fileTypes";
import { createBaseResource } from "../utils/resources";
import { ResourceProvider } from "./ResourceProvider";

export class FileProvider implements ResourceProvider {
  readonly id = "file";

  canHandle(input: ResourceInput): boolean {
    return Boolean(input.filePath?.trim()) || Boolean(input.url?.startsWith("file://"));
  }

  async createResource(input: ResourceInput): Promise<KnowledgeResource> {
    const filePath = input.filePath ?? input.url?.replace(/^file:\/\//, "") ?? "";
    const fallbackTitle = filePath.split(/[\\/]/).filter(Boolean).pop() ?? "Local file";
    const type = detectResourceTypeFromFilePath(filePath, input.type);
    const extension = extensionFromPath(filePath);

    return createBaseResource(
      {
        ...input,
        title: input.title ?? fallbackTitle,
        filePath,
        source: input.source ?? "vault",
        metadata: {
          ...input.metadata,
          extension,
          provider: this.id
        }
      },
      type,
      filePath
    );
  }

  normalize(resource: KnowledgeResource): KnowledgeResource {
    const filePath = resource.filePath?.trim() || null;
    return {
      ...resource,
      type: filePath ? detectResourceTypeFromFilePath(filePath, resource.type) : resource.type,
      filePath,
      source: resource.source || "vault",
      metadata: {
        ...resource.metadata,
        extension: filePath ? extensionFromPath(filePath) : null,
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
