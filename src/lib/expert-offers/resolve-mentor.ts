import 'server-only';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/database.types';
import type { OfferTimestamps } from '@/lib/expert-offers/status';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';

type ExpertOfferRow = Database['public']['Tables']['expert_offers']['Row'];

export const MENTOR_OFFER_FIELDS =
  'id, slug, email, expert_offers_enabled, stripe_onboarding_completed, compliance_status, is_listed';

export const PACKAGED_SESSIONS_DISABLED =
  'Packaged sessions are not enabled for this account.';

export type MentorOfferRow = {
  id: string;
  slug: string | null;
  email: string;
  expert_offers_enabled: boolean;
  stripe_onboarding_completed: boolean;
  compliance_status: string;
  is_listed: boolean;
};

export async function resolveMentorForSession(session: {
  userId: string;
  email: string;
}): Promise<MentorOfferRow | null> {
  const { data: byUser } = await supabaseAdmin
    .from('mentors')
    .select(MENTOR_OFFER_FIELDS)
    .eq('user_id', session.userId)
    .maybeSingle();
  if (byUser) return byUser as MentorOfferRow;

  const { data: byEmail } = await supabaseAdmin
    .from('mentors')
    .select(MENTOR_OFFER_FIELDS)
    .eq('email', session.email)
    .maybeSingle();
  return (byEmail as MentorOfferRow | null) ?? null;
}

export async function requireMentorOffersAccess(): Promise<
  { mentor: MentorOfferRow } | NextResponse
> {
  const session = await getSession();
  if (!session || (session.role !== 'mentor' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const mentor = await resolveMentorForSession(session);
  if (!mentor) {
    return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
  }

  if (!mentor.expert_offers_enabled) {
    return NextResponse.json({ error: PACKAGED_SESSIONS_DISABLED }, { status: 403 });
  }

  return { mentor };
}

export async function loadOwnedOffer(
  offerId: string,
  mentorId: string,
): Promise<ExpertOfferRow | NextResponse> {
  const { data, error } = await supabaseAdmin
    .from('expert_offers')
    .select('*')
    .eq('id', offerId)
    .eq('mentor_id', mentorId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return data as ExpertOfferRow;
}

export async function persistOfferTimestamps(
  offerId: string,
  mentorId: string,
  next: OfferTimestamps,
  nowIso: string,
): Promise<ExpertOfferRow | NextResponse> {
  const { data: updated, error } = await supabaseAdmin
    .from('expert_offers')
    .update({
      status: next.status,
      published_at: next.published_at,
      unpublished_at: next.unpublished_at,
      archived_at: next.archived_at,
      updated_at: nowIso,
    })
    .eq('id', offerId)
    .eq('mentor_id', mentorId)
    .select('*')
    .single();

  if (error || !updated) {
    return NextResponse.json(
      { error: error?.message ?? 'Could not update session.' },
      { status: 500 },
    );
  }
  return updated as ExpertOfferRow;
}
