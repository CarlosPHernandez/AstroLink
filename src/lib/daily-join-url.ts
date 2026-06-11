/**
 * daily-js call objects ignore the `?t=` query param (only Daily Prebuilt reads it),
 * so the meeting token must be split out and passed to join() explicitly.
 */
export function splitDailyJoinUrl(joinUrl: string): { url: string; token: string | null } {
  const url = new URL(joinUrl);
  const token = url.searchParams.get('t');
  url.searchParams.delete('t');
  return { url: url.toString(), token };
}
