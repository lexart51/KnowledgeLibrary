import { requestUrl } from "obsidian";
import { KnowledgeResource, ResourceInput, ValidationResult } from "../models/KnowledgeResource";
import { createBaseResource } from "../utils/resources";
import { ResourceProvider } from "./ResourceProvider";

export interface YouTubeVideoDetails {
  videoId: string;
  canonicalUrl: string;
  thumbnailUrl: string;
}

interface YouTubeOEmbedResponse {
  title?: string;
  author_name?: string;
}

type RequestUrl = typeof requestUrl;

const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export class YouTubeProvider implements ResourceProvider {
  readonly id = "youtube";

  constructor(private readonly fetchUrl: RequestUrl = requestUrl) {}

  canHandle(input: ResourceInput): boolean {
    return Boolean(input.url && parseYouTubeUrl(input.url));
  }

  async createResource(input: ResourceInput): Promise<KnowledgeResource> {
    const details = parseYouTubeUrl(input.url ?? "");

    if (!details) {
      throw new Error("Unsupported YouTube URL.");
    }

    const oEmbed = await this.fetchOEmbed(details.canonicalUrl);

    return createBaseResource(
      {
        ...input,
        title: input.title ?? oEmbed?.title ?? `YouTube Video ${details.videoId}`,
        creator: input.creator ?? oEmbed?.author_name ?? null,
        source: input.source ?? "YouTube",
        url: details.canonicalUrl,
        thumbnail: input.thumbnail ?? details.thumbnailUrl,
        metadata: {
          ...input.metadata,
          videoId: details.videoId,
          thumbnailFallbacks: buildYouTubeThumbnailFallbacks(details.videoId),
          provider: this.id
        }
      },
      "youtube",
      details.canonicalUrl
    );
  }

  normalize(resource: KnowledgeResource): KnowledgeResource {
    if (!resource.url) {
      return resource;
    }

    const details = parseYouTubeUrl(resource.url);
    if (!details) {
      return resource;
    }

    return {
      ...resource,
      source: resource.source || "YouTube",
      url: details.canonicalUrl,
      thumbnail: resource.thumbnail ?? details.thumbnailUrl,
      metadata: {
        ...resource.metadata,
        videoId: details.videoId,
        thumbnailFallbacks: buildYouTubeThumbnailFallbacks(details.videoId),
        provider: this.id
      }
    };
  }

  validate(resource: KnowledgeResource): ValidationResult {
    const details = resource.url ? parseYouTubeUrl(resource.url) : null;
    return {
      valid: Boolean(details),
      errors: details ? [] : ["YouTube resources require a supported youtube.com or youtu.be URL."]
    };
  }

  private async fetchOEmbed(canonicalUrl: string): Promise<YouTubeOEmbedResponse | null> {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;

    try {
      const response = await this.fetchUrl({ url: endpoint, method: "GET" });
      return response.json as YouTubeOEmbedResponse;
    } catch {
      return null;
    }
  }
}

export function parseYouTubeUrl(input: string): YouTubeVideoDetails | null {
  let url: URL;

  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
  let videoId: string | null = null;

  if (host === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
  }

  if (host === "youtube.com" || host.endsWith(".youtube.com")) {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    } else {
      const [, prefix, id] = url.pathname.split("/");
      if (["embed", "shorts", "live"].includes(prefix)) {
        videoId = id ?? null;
      }
    }
  }

  if (!videoId || !VIDEO_ID_PATTERN.test(videoId)) {
    return null;
  }

  return {
    videoId,
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
    thumbnailUrl: buildYouTubeThumbnailUrl(videoId, "hqdefault.jpg")
  };
}

export function buildYouTubeThumbnailFallbacks(videoId: string): string[] {
  return [
    buildYouTubeThumbnailUrl(videoId, "hqdefault.jpg"),
    buildYouTubeThumbnailUrl(videoId, "0.jpg"),
    buildYouTubeThumbnailUrl(videoId, "mqdefault.jpg")
  ];
}

function buildYouTubeThumbnailUrl(videoId: string, fileName: string): string {
  return `https://i.ytimg.com/vi/${videoId}/${fileName}`;
}
