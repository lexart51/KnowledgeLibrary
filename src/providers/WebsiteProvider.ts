import { requestUrl } from "obsidian";
import { KnowledgeResource, ResourceInput, ValidationResult } from "../models/KnowledgeResource";
import { createBaseResource } from "../utils/resources";
import { ResourceProvider } from "./ResourceProvider";

interface WebsiteTitleResponse {
  text?: string;
}

type RequestUrl = typeof requestUrl;

export class WebsiteProvider implements ResourceProvider {
  readonly id = "website";

  constructor(private readonly fetchUrl: RequestUrl = requestUrl) {}

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
    const normalizedUrl = normalizeWebsiteUrl(url);
    const title = input.title?.trim() || await this.fetchTitle(normalizedUrl) || url.hostname;
    const type = input.type === "book" ? "book" : "website";

    return createBaseResource(
      {
        ...input,
        title,
        source: input.source ?? url.hostname,
        url: normalizedUrl,
        metadata: {
          ...input.metadata,
          canonicalUrl: normalizedUrl,
          provider: this.id
        }
      },
      type,
      normalizedUrl
    );
  }

  normalize(resource: KnowledgeResource): KnowledgeResource {
    if (!resource.url) {
      return resource;
    }

    const normalizedUrl = normalizeWebsiteUrl(new URL(resource.url));
    return {
      ...resource,
      url: normalizedUrl,
      metadata: {
        ...resource.metadata,
        canonicalUrl: normalizedUrl,
        provider: this.id
      }
    };
  }

  validate(resource: KnowledgeResource): ValidationResult {
    return {
      valid: Boolean(resource.url),
      errors: resource.url ? [] : ["Website resources require url."]
    };
  }

  private async fetchTitle(url: string): Promise<string | null> {
    try {
      const response = await this.fetchUrl({ url, method: "GET" }) as WebsiteTitleResponse;
      const html = response.text ?? "";
      const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
      return match ? decodeHtml(match[1].replace(/\s+/g, " ").trim()) : null;
    } catch {
      return null;
    }
  }
}

export function normalizeWebsiteUrl(url: URL): string {
  url.hash = "";

  for (const key of Array.from(url.searchParams.keys())) {
    if (key.startsWith("utm_") || ["fbclid", "gclid", "mc_cid", "mc_eid", "feature", "si"].includes(key)) {
      url.searchParams.delete(key);
    }
  }

  return url.toString();
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
