/** First token of a display name (e.g. "Chris Sembroski" → "Chris"). */
export function firstDisplayName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed.split(/\s+/)[0] ?? trimmed;
}