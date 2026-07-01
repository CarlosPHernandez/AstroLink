import 'server-only';

import { unstable_cache } from 'next/cache';
import { getChrisCampaignId } from '@/lib/chris-campaign/chris-campaign-config';
import { getChrisCampaignSlotSnapshot } from '@/lib/chris-campaign/chris-campaign-slots';
import { supabaseAdmin } from '@/lib/supabase';

export type ChrisCampaignReferrerRow = {
  referrer: string;
  count: number;
};

export type AdminChrisCampaignMetrics = {
  campaignId: string;
  slotCap: number;
  slotsReserved: number;
  slotsRemaining: number;
  bookingsByStatus: Record<string, number>;
  bookingsByReferrer: ChrisCampaignReferrerRow[];
};

type BookingCampaignRow = {
  status: string;
  marketing_referrer: string | null;
};

async function fetchAdminChrisCampaignMetricsFromDb(): Promise<AdminChrisCampaignMetrics | null> {
  const campaignId = getChrisCampaignId();
  const snapshot = await getChrisCampaignSlotSnapshot(campaignId);

  const { data, error } = await (
    supabaseAdmin.from('bookings') as unknown as {
      select: (columns: string) => {
        eq: (
          column: string,
          value: string,
        ) => Promise<{ data: BookingCampaignRow[] | null; error: { message: string } | null }>;
      };
    }
  )
    .select('status, marketing_referrer')
    .eq('campaign_id', campaignId);

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const bookingsByStatus: Record<string, number> = {};
  const referrerCounts = new Map<string, number>();

  for (const row of rows) {
    bookingsByStatus[row.status] = (bookingsByStatus[row.status] ?? 0) + 1;
    const referrerKey =
      row.marketing_referrer && row.marketing_referrer.trim()
        ? row.marketing_referrer.trim()
        : '(direct)';
    referrerCounts.set(referrerKey, (referrerCounts.get(referrerKey) ?? 0) + 1);
  }

  const bookingsByReferrer: ChrisCampaignReferrerRow[] = [...referrerCounts.entries()]
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count);

  const slotCap = snapshot?.slotCap ?? 0;
  const slotsReserved = snapshot?.slotsReserved ?? 0;

  return {
    campaignId,
    slotCap,
    slotsReserved,
    slotsRemaining: Math.max(0, slotCap - slotsReserved),
    bookingsByStatus,
    bookingsByReferrer,
  };
}

/** Cached 60s — Chris campaign ops snapshot for admin dashboard. */
export async function getAdminChrisCampaignMetrics(): Promise<AdminChrisCampaignMetrics | null> {
  return unstable_cache(fetchAdminChrisCampaignMetricsFromDb, ['admin-chris-campaign-metrics'], {
    revalidate: 60,
  })();
}
