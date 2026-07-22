/**
 * Earliest safe datetime-local for booking E2E.
 * Platform rule: today and tomorrow are not bookable (2 calendar-day lead).
 * Use +3 local days so we stay past the lead window even near midnight.
 */
export function futureDatetimeLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  d.setHours(14, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T14:00`;
}
