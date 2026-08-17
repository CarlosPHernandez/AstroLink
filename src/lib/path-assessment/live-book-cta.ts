/** Live-session CTA copy. Named match is the primary book path. */
export function liveBookCtaCopy(fullName?: string | null): {
  mobile: string;
  desktop: string;
} {
  const name = fullName?.trim() ?? '';
  if (!name) {
    return {
      mobile: 'Book a live session',
      desktop: 'Book a live session — Gemini matches you',
    };
  }
  const first = name.split(/\s+/)[0] ?? name;
  return {
    mobile: `Book ${first}`,
    desktop: `Book ${name}`,
  };
}
