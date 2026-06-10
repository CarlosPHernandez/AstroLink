/** Bios longer than this show a collapsed preview with Read more in directory modals. */
export const EXPERT_BIO_PREVIEW_MAX_CHARS = 280;

export function isBioLong(bio: string): boolean {
  return bio.trim().length > EXPERT_BIO_PREVIEW_MAX_CHARS;
}

/** Truncate at a word boundary near the character limit for preview text. */
export function getBioPreview(bio: string): string {
  const trimmed = bio.trim();
  if (!isBioLong(trimmed)) {
    return trimmed;
  }

  const slice = trimmed.slice(0, EXPERT_BIO_PREVIEW_MAX_CHARS);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > EXPERT_BIO_PREVIEW_MAX_CHARS * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trim()}…`;
}
