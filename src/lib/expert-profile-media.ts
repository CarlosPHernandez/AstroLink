export const PORTRAIT_MAX_BYTES = 5 * 1024 * 1024;
export const INTRO_MAX_BYTES = 100 * 1024 * 1024;
export const PROFILE_MEDIA_URL_LIMIT = 10;
export const PROFILE_MEDIA_URL_WINDOW_MS = 60 * 60 * 1000;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const PORTRAIT_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

const INTRO_TYPES = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
} as const;

export type ProfileMediaKind = 'portrait' | 'intro';

export function isPublicExpertSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

export function expertInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export function mediaObjectPath(
  slug: string,
  kind: ProfileMediaKind,
  contentType: string,
): string | null {
  if (!isPublicExpertSlug(slug)) return null;
  const ext =
    kind === 'portrait'
      ? PORTRAIT_TYPES[contentType as keyof typeof PORTRAIT_TYPES]
      : INTRO_TYPES[contentType as keyof typeof INTRO_TYPES];
  if (!ext) return null;
  const file = kind === 'portrait' ? 'portrait' : 'intro';
  return `${slug}/${file}.${ext}`;
}

/** Accept only the exact object name this mentor is allowed to replace. */
export function isExactOwnedMediaPath(
  slug: string,
  kind: ProfileMediaKind,
  path: string,
): boolean {
  if (!isPublicExpertSlug(slug)) return false;
  if (path.includes('..') || path.includes('\\') || path.includes('%') || path.includes('://')) {
    return false;
  }
  const exts = kind === 'portrait' ? Object.values(PORTRAIT_TYPES) : Object.values(INTRO_TYPES);
  const file = kind === 'portrait' ? 'portrait' : 'intro';
  return exts.some((ext) => path === `${slug}/${file}.${ext}`);
}

export function portraitHeaderOk(bytes: Uint8Array): boolean {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return true;
  }
  if (bytes.length >= 12) {
    const riff = String.fromCharCode(...bytes.slice(0, 4));
    const webp = String.fromCharCode(...bytes.slice(8, 12));
    if (riff === 'RIFF' && webp === 'WEBP') return true;
  }
  return false;
}

export function introHeaderOk(bytes: Uint8Array): boolean {
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return true;
  }
  if (bytes.length >= 8) {
    const brand = String.fromCharCode(...bytes.slice(4, 8));
    if (brand === 'ftyp') return true;
  }
  return false;
}

export function publicMediaUrl(publicObjectUrl: string, version: number): string {
  const base = publicObjectUrl.split('?')[0];
  return `${base}?v=${version}`;
}

const urlHits = new Map<string, number[]>();

export function resetProfileMediaRateLimit(): void {
  urlHits.clear();
}

export function assertProfileMediaRateLimit(mentorId: string, now = Date.now()): void {
  const recent = (urlHits.get(mentorId) ?? []).filter((ts) => now - ts < PROFILE_MEDIA_URL_WINDOW_MS);
  if (recent.length >= PROFILE_MEDIA_URL_LIMIT) {
    throw new ProfileMediaRateLimitError();
  }
  recent.push(now);
  urlHits.set(mentorId, recent);
}

export class ProfileMediaRateLimitError extends Error {
  constructor() {
    super('Too many uploads. Try again later.');
    this.name = 'ProfileMediaRateLimitError';
  }
}
