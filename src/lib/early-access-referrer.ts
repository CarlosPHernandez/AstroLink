/**
 * Parse marketing referrer from early-access landing URLs.
 * Zen uses stable `ref` values — see docs/how-to/marketing-referrer-taxonomy.md
 */
export function parseEarlyAccessReferrer(search: string): string | undefined {
  if (!search) return undefined;
  const params = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  );
  const ref = params.get('ref')?.trim();
  if (!ref || ref.length > 500) return undefined;
  return ref;
}
