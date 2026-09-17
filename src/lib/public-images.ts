export const DEFAULT_MENTOR_IMAGE = '/chris_sembroski.webp';

/** Prefer pre-generated WebP assets in /public for local paths. */
export function toOptimizedImageUrl(url: string): string {
  const src = url.trim() || DEFAULT_MENTOR_IMAGE;
  if (!src.startsWith('/')) return src;
  return src.replace(/\.(jpe?g|png)$/i, '.webp');
}
