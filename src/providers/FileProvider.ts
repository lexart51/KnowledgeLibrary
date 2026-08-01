import { KnowledgeResource, ResourceInput, ValidationResult } from "../models/KnowledgeResource";
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

    return createBaseResource(
      {
        ...input,
        title: input.title ?? fallbackTitle,
        filePath,
        source: input.source ?? "file"
      },
      "file",
      filePath
    );
  }

  normalize(resource: KnowledgeResource): KnowledgeResource {
    return {
      ...resource,
      filePath: resource.filePath?.trim() || null,
      source: resource.source || "file"
    };
  }

  validate(resource: KnowledgeResource): ValidationResult {
    return {
      valid: Boolean(resource.filePath),
      errors: resource.filePath ? [] : ["File resources require filePath."]
    };
  }
}
