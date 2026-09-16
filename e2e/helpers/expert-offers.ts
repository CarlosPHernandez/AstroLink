import { createClient } from '@supabase/supabase-js';

export const E2E_MENTOR_EMAIL = 'chris@astrolink.ai';
export const E2E_OFFER_TITLE_PREFIX = '[e2e-offer]';

export type MentorOfferFlags = {
  expert_offers_enabled: boolean;
  stripe_onboarding_completed: boolean;
};

export function hasSupabaseAdminEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function isMissingExpertOffersRelation(message: string): boolean {
  return /expert_offers|schema cache|does not exist|PGRST205|42703/i.test(message);
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for E2E cleanup');
  }
  return createClient(url, key);
}

export async function probeExpertOffersTable(): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('expert_offers').select('id').limit(1);
  if (error) {
    throw new Error(error.message);
  }
}

export async function readMentorOfferFlags(email: string): Promise<MentorOfferFlags | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('mentors')
    .select('expert_offers_enabled, stripe_onboarding_completed')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw new Error(`E2E failed to read mentor offer flags: ${error.message}`);
  }
  if (!data) return null;

  return {
    expert_offers_enabled: Boolean(data.expert_offers_enabled),
    stripe_onboarding_completed: Boolean(data.stripe_onboarding_completed),
  };
}

export async function setMentorExpertOffersEnabled(email: string, enabled: boolean): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('mentors')
    .update({ expert_offers_enabled: enabled })
    .eq('email', email)
    .select('id')
    .maybeSingle();

  if (error) {
    throw new Error(`E2E failed to set expert_offers_enabled: ${error.message}`);
  }
  if (!data) {
    throw new Error(`E2E mentor not found for ${email}`);
  }
}

export async function setMentorStripeOnboardingCompleted(
  email: string,
  completed: boolean,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('mentors')
    .update({ stripe_onboarding_completed: completed })
    .eq('email', email)
    .select('id')
    .maybeSingle();

  if (error) {
    throw new Error(`E2E failed to set stripe_onboarding_completed: ${error.message}`);
  }
  if (!data) {
    throw new Error(`E2E mentor not found for ${email}`);
  }
}

async function mentorIdByEmail(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  email: string,
): Promise<string | null> {
  const { data, error } = await supabase.from('mentors').select('id').eq('email', email).maybeSingle();
  if (error) {
    throw new Error(`E2E failed to look up mentor: ${error.message}`);
  }
  return data?.id ?? null;
}

async function deleteBookingsForOfferIds(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  offerIds: string[],
) {
  if (!offerIds.length) return;

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id')
    .in('expert_offer_id', offerIds);

  if (error) {
    if (isMissingExpertOffersRelation(error.message)) return;
    throw new Error(`E2E cleanup failed to list offer bookings: ${error.message}`);
  }

  const ids = (bookings ?? []).map((row) => row.id);
  if (!ids.length) return;

  const { error: txError } = await supabase.from('transactions').delete().in('booking_id', ids);
  if (txError) {
    throw new Error(`E2E cleanup failed to delete transactions: ${txError.message}`);
  }

  const { error: bookingError } = await supabase.from('bookings').delete().in('id', ids);
  if (bookingError) {
    throw new Error(`E2E cleanup failed to delete offer bookings: ${bookingError.message}`);
  }
}

/** Deletes `[e2e-offer]` rows for the mentor (tests only). */
export async function deleteMentorOffers(mentorEmail: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const mentorId = await mentorIdByEmail(supabase, mentorEmail);
  if (!mentorId) return;

  const { data, error } = await supabase
    .from('expert_offers')
    .select('id')
    .eq('mentor_id', mentorId)
    .like('title', `${E2E_OFFER_TITLE_PREFIX}%`);

  if (error) {
    if (isMissingExpertOffersRelation(error.message)) return;
    throw new Error(`E2E cleanup failed to list offers: ${error.message}`);
  }

  const offerIds = (data ?? []).map((row) => row.id);
  await deleteBookingsForOfferIds(supabase, offerIds);

  if (!offerIds.length) return;

  const { error: deleteError } = await supabase.from('expert_offers').delete().in('id', offerIds);
  if (deleteError) {
    throw new Error(`E2E cleanup failed to delete offers: ${deleteError.message}`);
  }
}
