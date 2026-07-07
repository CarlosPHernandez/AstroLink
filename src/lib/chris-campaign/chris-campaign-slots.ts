import 'server-only';

import { getChrisCampaignId } from '@/lib/chris-campaign/chris-campaign-config';
import { supabaseAdmin } from '@/lib/supabase';

export class ChrisCampaignSoldOutError extends Error {
  constructor() {
    super('All Chris Sembroski sessions are currently reserved.');
    this.name = 'ChrisCampaignSoldOutError';
  }
}

const CAMPAIGN_SLOT_RELEASE_TERMINAL_STATUSES = new Set([
  'cancelled',
  'completed',
  'refunded',
]);

export function shouldReleaseChrisCampaignSlotForStatus(
  status: string,
  campaignId: string | null | undefined,
): campaignId is string {
  return (
    typeof campaignId === 'string' &&
    campaignId.length > 0 &&
    !CAMPAIGN_SLOT_RELEASE_TERMINAL_STATUSES.has(status)
  );
}

export async function reserveChrisCampaignSlot(campaignId: string): Promise<boolean> {
  // RPC added in 20260627120000_booking_campaigns.sql (types regenerated after migration apply).
  const { data, error } = await (
    supabaseAdmin as unknown as {
      rpc: (
        fn: string,
        args: { p_campaign_id: string },
      ) => Promise<{ data: boolean | null; error: { message: string } | null }>;
    }
  ).rpc('booking_campaign_try_reserve', {
    p_campaign_id: campaignId,
  });

  if (error) {
    throw new Error(`Campaign slot reserve failed: ${error.message}`);
  }

  return data === true;
}

export async function releaseChrisCampaignSlot(campaignId: string): Promise<void> {
  const { error } = await (
    supabaseAdmin as unknown as {
      rpc: (
        fn: string,
        args: { p_campaign_id: string },
      ) => Promise<{ error: { message: string } | null }>;
    }
  ).rpc('booking_campaign_release', {
    p_campaign_id: campaignId,
  });

  if (error) {
    throw new Error(`Campaign slot release failed: ${error.message}`);
  }
}

export type ChrisCampaignSlotSnapshot = {
  campaignId: string;
  slotCap: number;
  slotsReserved: number;
  slotsRemaining: number;
};

export async function getChrisCampaignSlotSnapshot(
  campaignId: string = getChrisCampaignId(),
): Promise<ChrisCampaignSlotSnapshot | null> {
  const { data, error } = await (
    supabaseAdmin as unknown as {
      from: (table: string) => {
        select: (cols: string) => {
          eq: (
            col: string,
            val: string,
          ) => {
            maybeSingle: () => Promise<{
              data: { id: string; slot_cap: number; slots_reserved: number } | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    }
  )
    .from('booking_campaigns')
    .select('id, slot_cap, slots_reserved')
    .eq('id', campaignId)
    .maybeSingle();

  if (error) {
    throw new Error(`Campaign slot lookup failed: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const slotCap = data.slot_cap;
  const slotsReserved = data.slots_reserved;
  return {
    campaignId: data.id,
    slotCap,
    slotsReserved,
    slotsRemaining: Math.max(0, slotCap - slotsReserved),
  };
}
