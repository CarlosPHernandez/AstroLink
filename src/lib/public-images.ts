/** Prefer pre-generated WebP assets in /public for local paths. */
export function toOptimizedImageUrl(url: string): string {
  if (!url.startsWith('/')) return url;
  return url.replace(/\.(jpe?g|png)$/i, '.webp');
}

export const DEFAULT_MENTOR_IMAGE = '/chris_sembroski.webp';
