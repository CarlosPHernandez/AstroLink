import 'server-only';

import {
  CHRIS_BOOKING_CAMPAIGN_QUERY,
  getChrisCampaignId,
  getChrisMentorSlug,
  isChrisBookingEnabled,
} from '@/lib/chris-campaign/chris-campaign-config';
import { supabaseAdmin } from '@/lib/supabase';

export async function resolveChrisMentorId(): Promise<string> {
  const slug = getChrisMentorSlug();
  const { data, error } = await supabaseAdmin
    .from('mentors')
    .select('id')
    .eq('slug', slug)
    .eq('compliance_status', 'approved')
    .eq('is_listed', true)
    .maybeSingle();

  if (error || !data) {
    throw new Error('Chris Sembroski is not available for booking.');
  }

  return data.id;
}

export type ChrisCampaignBookingContext = {
  campaignId: string;
  mentorId: string;
};

/**
 * Validates campaign=chris bookings. Returns campaign + mentor ids for slot reserve when active.
 */
export async function resolveChrisCampaignForBooking(params: {
  campaign?: typeof CHRIS_BOOKING_CAMPAIGN_QUERY;
  mentorId?: string;
}): Promise<ChrisCampaignBookingContext | undefined> {
  if (!params.campaign) {
    return undefined;
  }

  if (params.campaign !== CHRIS_BOOKING_CAMPAIGN_QUERY) {
    throw new Error('Unknown booking campaign.');
  }

  if (!isChrisBookingEnabled()) {
    throw new Error('Chris sessions are not available right now.');
  }

  const chrisMentorId = await resolveChrisMentorId();
  if (params.mentorId && params.mentorId !== chrisMentorId) {
    throw new Error('This offer is only available with Chris Sembroski.');
  }

  return {
    campaignId: getChrisCampaignId(),
    mentorId: chrisMentorId,
  };
}