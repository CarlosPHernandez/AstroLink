/** Eastern Time label for ops canvases — matches `early_access_signups.est_time` in Supabase. */
export function formatEarlyAccessEstTime(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${get('month')} ${get('day')}, ${get('year')} at ${get('hour')}:${get('minute')} ${get('dayPeriod')} ET`;
}