/** Hard cap so phone UI stays a hook, not a free mini-session. */
export const LANDING_TEASER_MAX_CHARS = 200;

/**
 * Collapse LLM glitches: repeated paragraphs, truncated-then-full doubles,
 * and mid-word hard cuts.
 */
export function sanitizeLandingTeaser(raw: string): string {
  const collapsed = raw.replace(/\s+/g, ' ').trim();
  if (!collapsed) {
    return '';
  }

  // Prefer the longest line when the model emits the same pitch twice (newline-separated).
  const lines = raw
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length >= 16);

  let text = collapsed;
  if (lines.length >= 2) {
    const longest = lines.reduce((best, line) => (line.length >= best.length ? line : best));
    const isNearDuplicate = lines.every((line) => {
      const n = Math.min(48, line.length, longest.length);
      return (
        longest.startsWith(line.slice(0, n)) ||
        line.startsWith(longest.slice(0, n))
      );
    });
    if (isNearDuplicate) {
      text = longest;
    }
  }

  // "short prefix" + "same text completed" concatenated in one string
  for (let len = Math.floor(text.length / 2); len >= 40; len -= 1) {
    const first = text.slice(0, len).trim();
    const second = text.slice(len).trim();
    if (second.length < 40) {
      continue;
    }
    const probe = Math.min(48, first.length, second.length);
    if (second.startsWith(first.slice(0, probe))) {
      text = second;
      break;
    }
    if (first.startsWith(second.slice(0, probe))) {
      text = first;
      break;
    }
  }

  return truncateAtWordBoundary(text, LANDING_TEASER_MAX_CHARS);
}

export function truncateAtWordBoundary(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }

  const slice = trimmed.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > maxChars * 0.55 ? slice.slice(0, lastSpace) : slice;
  return `${cut.replace(/[,:;–—\-\s]+$/u, '').trim()}…`;
}

/** Chat UI only needs the user goal + a single expert teaser bubble. */
export function takeLandingRelayChatMessages<T extends { role: 'user' | 'expert'; text: string }>(
  messages: T[],
): T[] {
  const user = messages.find((message) => message.role === 'user');
  const expert = messages.find((message) => message.role === 'expert');
  if (!user || !expert) {
    return messages.slice(0, 2);
  }

  return [
    { ...user, text: user.text.trim() },
    { ...expert, text: sanitizeLandingTeaser(expert.text) },
  ] as T[];
}
