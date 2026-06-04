import 'server-only';
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

export async function getAdminWaitlistMetrics(): Promise<AdminWaitlistMetrics> {
  const { count: total, error: totalError } = await supabaseAdmin
    .from('early_access_signups')
    .select('*', { count: 'exact', head: true });

  if (totalError) {
    throw new Error(totalError.message);
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 14);

  const { data: recentRows, error: recentError } = await supabaseAdmin
    .from('early_access_signups')
    .select('created_at, referrer')
    .gte('created_at', fourteenDaysAgo.toISOString());

  if (recentError) {
    throw new Error(recentError.message);
  }

  const rows = recentRows ?? [];
  let last7d = 0;
  let prev7d = 0;
  const dayCounts = new Map<string, number>();
  const referrerCounts = new Map<string, number>();

  for (const row of rows) {
    const created = new Date(row.created_at);
    if (created >= sevenDaysAgo) {
      last7d += 1;
      const dayKey = created.toISOString().slice(0, 10);
      dayCounts.set(dayKey, (dayCounts.get(dayKey) ?? 0) + 1);
    } else {
      prev7d += 1;
    }
  }

  const { data: allReferrerRows, error: referrerError } = await supabaseAdmin
    .from('early_access_signups')
    .select('referrer');

  if (referrerError) {
    throw new Error(referrerError.message);
  }

  for (const row of allReferrerRows ?? []) {
    const key =
      row.referrer && row.referrer.trim() ? row.referrer.trim() : '(direct)';
    referrerCounts.set(key, (referrerCounts.get(key) ?? 0) + 1);
  }

  const dailyTrend: WaitlistDailyPoint[] = [...dayCounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, signups]) => ({ day, signups }));

  const topReferrers: WaitlistReferrerRow[] = [...referrerCounts.entries()]
    .map(([referrer, signups]) => ({ referrer, signups }))
    .sort((a, b) => b.signups - a.signups)
    .slice(0, 10);

  return {
    total: total ?? 0,
    last7d,
    prev7d,
    wowPercent: computeWowPercent(last7d, prev7d),
    dailyTrend,
    topReferrers,
  };
}
