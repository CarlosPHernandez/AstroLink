import 'server-only';

import type { ComplianceStatus } from '@/lib/types';
import { revalidateMentorDirectory } from '@/lib/revalidate-mentors';
import { supabaseAdmin } from '@/lib/supabase';

export type MentorProfileUpdate = {
  employer: string;
  expertise: string[];
  bio: string;
  liveSessionPriceCents: number;
  isCivilServant: boolean;
};

export type MentorProfileRow = {
  fullName: string;
  email: string;
  employer: string;
  expertise: string[];
  bio: string;
  liveSessionPriceCents: number;
  complianceStatus: ComplianceStatus;
  stripeOnboardingCompleted: boolean;
  stripeConnectAccountId: string | null;
  isCivilServant: boolean;
};

function resolveComplianceOnProfileSave(
  currentStatus: ComplianceStatus,
  isCivilServant: boolean,
): ComplianceStatus | undefined {
  if (currentStatus === 'approved') {
    return undefined;
  }
  if (isCivilServant) {
    return 'document_required';
  }
  if (currentStatus === 'document_required') {
    return 'awaiting_human_approval';
  }
  return undefined;
}

export async function getMentorProfileRow(mentorId: string): Promise<MentorProfileRow | null> {
  const { data, error } = await supabaseAdmin
    .from('mentors')
    .select(
      'full_name, email, employer, expertise, bio, live_session_price_cents, compliance_status, stripe_onboarding_completed, stripe_connect_account_id, is_civil_servant',
    )
    .eq('id', mentorId)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error('getMentorProfileRow:', error.message);
    }
    return null;
  }

  return {
    fullName: data.full_name,
    email: data.email,
    employer: data.employer,
    expertise: data.expertise,
    bio: data.bio,
    liveSessionPriceCents: data.live_session_price_cents,
    complianceStatus: data.compliance_status,
    stripeOnboardingCompleted: data.stripe_onboarding_completed,
    stripeConnectAccountId: data.stripe_connect_account_id,
    isCivilServant: data.is_civil_servant,
  };
}

export async function updateMentorProfile(
  mentorId: string,
  update: MentorProfileUpdate,
): Promise<MentorProfileRow | null> {
  const existing = await getMentorProfileRow(mentorId);
  if (!existing) {
    return null;
  }

  const complianceStatus = resolveComplianceOnProfileSave(
    existing.complianceStatus,
    update.isCivilServant,
  );

  const { data, error } = await supabaseAdmin
    .from('mentors')
    .update({
      employer: update.employer,
      expertise: update.expertise,
      bio: update.bio,
      live_session_price_cents: update.liveSessionPriceCents,
      is_civil_servant: update.isCivilServant,
      ...(complianceStatus ? { compliance_status: complianceStatus } : {}),
    })
    .eq('id', mentorId)
    .select(
      'full_name, email, employer, expertise, bio, live_session_price_cents, compliance_status, stripe_onboarding_completed, stripe_connect_account_id, is_civil_servant',
    )
    .single();

  if (error || !data) {
    console.error('updateMentorProfile:', error?.message);
    return null;
  }

  revalidateMentorDirectory();

  return {
    fullName: data.full_name,
    email: data.email,
    employer: data.employer,
    expertise: data.expertise,
    bio: data.bio,
    liveSessionPriceCents: data.live_session_price_cents,
    complianceStatus: data.compliance_status,
    stripeOnboardingCompleted: data.stripe_onboarding_completed,
    stripeConnectAccountId: data.stripe_connect_account_id,
    isCivilServant: data.is_civil_servant,
  };
}

export async function recordMentorNf1860Upload(
  mentorId: string,
  pdfBuffer: Buffer,
): Promise<{ complianceStatus: ComplianceStatus } | null> {
  const existing = await getMentorProfileRow(mentorId);
  if (!existing) {
    return null;
  }

  const { ComplianceAgent } = await import('@/services/agents/compliance-agent');
  const agent = new ComplianceAgent();

  try {
    await agent.onboardMentor(mentorId, {
      fullName: existing.fullName,
      email: existing.email,
      employer: existing.employer,
      expertise: existing.expertise,
      bio: existing.bio,
      isCivilServantDeclared: true,
      nf1860PdfBuffer: pdfBuffer,
    });
  } catch (err) {
    console.error('recordMentorNf1860Upload compliance agent:', err);
    await supabaseAdmin.from('compliance_reviews').insert({
      mentor_id: mentorId,
      is_civil_servant: true,
      bio_risk_rating: 'medium',
      bio_analysis_reasoning: 'NF-1860 uploaded from mentor dashboard; automated parse unavailable.',
    });
  }

  const nextStatus: ComplianceStatus =
    existing.complianceStatus === 'approved'
      ? 'approved'
      : 'awaiting_human_approval';

  const { error } = await supabaseAdmin
    .from('mentors')
    .update({
      is_civil_servant: true,
      compliance_status: nextStatus,
    })
    .eq('id', mentorId);

  if (error) {
    console.error('recordMentorNf1860Upload:', error.message);
    return null;
  }

  revalidateMentorDirectory();

  return { complianceStatus: nextStatus };
}