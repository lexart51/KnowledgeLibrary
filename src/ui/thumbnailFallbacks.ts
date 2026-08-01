import { parseYouTubeUrl } from "../providers/YouTubeProvider";

export function getYouTubeThumbnailFallbacks(resourceThumbnail: string | null, resourceUrl: string | null): string[] {
  const fromThumbnail = extractVideoIdFromThumbnail(resourceThumbnail);
  const fromUrl = resourceUrl ? parseYouTubeUrl(resourceUrl)?.videoId ?? null : null;
  const videoId = fromThumbnail ?? fromUrl;

  if (!videoId) {
    return [];
  }

  return [
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/0.jpg`,
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
  ];
}

function extractVideoIdFromThumbnail(thumbnail: string | null): string | null {
  if (!thumbnail) {
    return null;
  }

  const match = /\/vi\/([a-zA-Z0-9_-]{11})\//.exec(thumbnail);
  return match?.[1] ?? null;
}
