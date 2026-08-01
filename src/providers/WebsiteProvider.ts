import { KnowledgeResource, ResourceInput, ValidationResult } from "../models/KnowledgeResource";
import { createBaseResource } from "../utils/resources";
import { ResourceProvider } from "./ResourceProvider";

export class WebsiteProvider implements ResourceProvider {
  readonly id = "website";

  canHandle(input: ResourceInput): boolean {
    if (!input.url) {
      return false;
    }

    try {
      const url = new URL(input.url);
      const host = url.hostname.toLowerCase();
      return ["http:", "https:"].includes(url.protocol) && !host.endsWith("youtube.com") && host !== "youtu.be";
    } catch {
      return false;
    }
  }

  async createResource(input: ResourceInput): Promise<KnowledgeResource> {
    const url = new URL(input.url ?? "");
    const normalizedUrl = this.normalizeUrl(url);

    return createBaseResource(
      {
        ...input,
        title: input.title ?? url.hostname,
        source: input.source ?? url.hostname,
        url: normalizedUrl
      },
      "website",
      normalizedUrl
    );
  }

  normalize(resource: KnowledgeResource): KnowledgeResource {
    if (!resource.url) {
      return resource;
    }

    return {
      ...resource,
      url: this.normalizeUrl(new URL(resource.url))
    };
  }

  validate(resource: KnowledgeResource): ValidationResult {
    return {
      valid: Boolean(resource.url),
      errors: resource.url ? [] : ["Website resources require url."]
    };
  }

  private normalizeUrl(url: URL): string {
    url.hash = "";

    for (const key of Array.from(url.searchParams.keys())) {
      if (key.startsWith("utm_") || ["fbclid", "gclid", "mc_cid", "mc_eid"].includes(key)) {
        url.searchParams.delete(key);
      }
    }

    return url.toString();
  }
}
