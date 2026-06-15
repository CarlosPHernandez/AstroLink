import 'server-only';

import { unstable_cache } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';

export type WaitlistDailyPoint = {
  day: string;
  signups: number;
};

export type WaitlistReferrerRow = {
  referrer: string;
  signups: number;
};

export type AdminWaitlistMetrics = {
  total: number;
  last7d: number;
  prev7d: number;
  wowPercent: number | null;
  dailyTrend: WaitlistDailyPoint[];
  topReferrers: WaitlistReferrerRow[];
};

function computeWowPercent(last7d: number, prev7d: number): number | null {
  if (prev7d === 0) {
    return last7d === 0 ? 0 : null;
  }
  return Math.round(((last7d - prev7d) / prev7d) * 1000) / 10;
}

async function fetchAdminWaitlistMetricsFromDb(): Promise<AdminWaitlistMetrics> {
  const { data: rows, error } = await supabaseAdmin
    .from('early_access_signups')
    .select('created_at, referrer');

  if (error) {
    throw new Error(error.message);
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 14);

  const allRows = rows ?? [];
  let last7d = 0;
  let prev7d = 0;
  const dayCounts = new Map<string, number>();
  const referrerCounts = new Map<string, number>();

  for (const row of allRows) {
    const referrerKey =
      row.referrer && row.referrer.trim() ? row.referrer.trim() : '(direct)';
    referrerCounts.set(referrerKey, (referrerCounts.get(referrerKey) ?? 0) + 1);

    const created = new Date(row.created_at);
    if (created >= sevenDaysAgo) {
      last7d += 1;
      const dayKey = created.toISOString().slice(0, 10);
      dayCounts.set(dayKey, (dayCounts.get(dayKey) ?? 0) + 1);
    } else if (created >= fourteenDaysAgo) {
      prev7d += 1;
    }
  }

  const dailyTrend: WaitlistDailyPoint[] = [...dayCounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, signups]) => ({ day, signups }));

  const topReferrers: WaitlistReferrerRow[] = [...referrerCounts.entries()]
    .map(([referrer, signups]) => ({ referrer, signups }))
    .sort((a, b) => b.signups - a.signups)
    .slice(0, 10);

  return {
    total: allRows.length,
    last7d,
    prev7d,
    wowPercent: computeWowPercent(last7d, prev7d),
    dailyTrend,
    topReferrers,
  };
}

/** Cached 60s — admin metrics do not need real-time precision. */
export async function getAdminWaitlistMetrics(): Promise<AdminWaitlistMetrics> {
  return unstable_cache(fetchAdminWaitlistMetricsFromDb, ['admin-waitlist-metrics'], {
    revalidate: 60,
  })();
}