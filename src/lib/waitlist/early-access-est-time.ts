import { formatEasternTime } from '@/lib/format-eastern-time';

/** Eastern Time label for ops canvases — matches `early_access_signups.est_time` in Supabase. */
export function formatEarlyAccessEstTime(date: Date = new Date()): string {
  return formatEasternTime(date);
}
