import { parseYouTubeUrl } from "../providers/YouTubeProvider";

export function getYouTubeThumbnailFallbacks(resourceThumbnail: string | null, resourceUrl: string | null, resourceVideoId?: string | null): string[] {
  const fromThumbnail = extractVideoIdFromThumbnail(resourceThumbnail);
  const fromUrl = resourceUrl ? parseYouTubeUrl(resourceUrl)?.videoId ?? null : null;
  const videoId = resourceVideoId ?? fromThumbnail ?? fromUrl;

  if (!videoId) {
    return resourceThumbnail ? [resourceThumbnail] : [];
  }

  return uniqueUrls([
    resourceThumbnail,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/0.jpg`,
    `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
  ]);
}

function extractVideoIdFromThumbnail(thumbnail: string | null): string | null {
  if (!thumbnail) {
    return null;
  }

  const match = /\/vi\/([a-zA-Z0-9_-]{11})\//.exec(thumbnail);
  return match?.[1] ?? null;
}

function uniqueUrls(urls: Array<string | null | undefined>): string[] {
  return Array.from(new Set(urls.filter((url): url is string => Boolean(url))));
}
