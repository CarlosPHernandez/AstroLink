import 'server-only';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';

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
