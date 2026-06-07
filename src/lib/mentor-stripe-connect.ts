import 'server-only';

import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import type { ComplianceStatus } from '@/lib/types';

function appBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

type MentorStripeRow = {
  email: string;
  full_name: string;
  stripe_connect_account_id: string | null;
  stripe_onboarding_completed: boolean;
  compliance_status: ComplianceStatus;
};

/** Preserve approved mentors when Stripe onboarding state changes. */
export function resolveStripeOnboardingMentorUpdate(
  currentStatus: ComplianceStatus,
  onboardingComplete: boolean,
): {
  stripe_onboarding_completed: boolean;
  compliance_status?: ComplianceStatus;
} {
  if (onboardingComplete) {
    return {
      stripe_onboarding_completed: true,
      ...(currentStatus !== 'approved'
        ? { compliance_status: 'awaiting_human_approval' as const }
        : {}),
    };
  }

  return {
    stripe_onboarding_completed: false,
    ...(currentStatus !== 'approved'
      ? { compliance_status: 'stripe_incomplete' as const }
      : {}),
  };
}

export async function getMentorStripeRow(mentorId: string): Promise<MentorStripeRow | null> {
  const { data, error } = await supabaseAdmin
    .from('mentors')
    .select(
      'email, full_name, stripe_connect_account_id, stripe_onboarding_completed, compliance_status',
    )
    .eq('id', mentorId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Creates or refreshes a Stripe Connect Express onboarding link.
 * Uses existing v1 Express accounts (ComplianceAgent parity).
 */
export async function createMentorOnboardingLink(
  mentorId: string,
): Promise<{ url: string; accountId: string }> {
  const mentor = await getMentorStripeRow(mentorId);
  if (!mentor) {
    throw new Error('Mentor profile not found.');
  }

  let accountId = mentor.stripe_connect_account_id;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: mentor.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: { mentor_id: mentorId },
    });

    accountId = account.id;

    await supabaseAdmin
      .from('mentors')
      .update({
        stripe_connect_account_id: accountId,
        ...(mentor.compliance_status !== 'approved'
          ? { compliance_status: 'stripe_incomplete' as const }
          : {}),
      })
      .eq('id', mentorId);
  }

  const base = appBaseUrl();
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${base}/onboard/stripe-retry`,
    return_url: `${base}/onboard/stripe-success`,
    type: 'account_onboarding',
  });

  return { url: accountLink.url, accountId };
}

/** Opens the Stripe Express dashboard for payout history and bank details. */
export async function createMentorExpressDashboardLink(
  mentorId: string,
): Promise<string | null> {
  const mentor = await getMentorStripeRow(mentorId);
  if (!mentor?.stripe_connect_account_id) {
    return null;
  }

  const loginLink = await stripe.accounts.createLoginLink(mentor.stripe_connect_account_id);
  return loginLink.url;
}

export async function syncMentorStripeAccountStatus(
  mentorId: string,
  stripeConnectAccountId: string,
): Promise<{ chargesEnabled: boolean; payoutsEnabled: boolean }> {
  const mentor = await getMentorStripeRow(mentorId);
  if (!mentor || mentor.stripe_connect_account_id !== stripeConnectAccountId) {
    return { chargesEnabled: false, payoutsEnabled: false };
  }

  const stripeAccount = await stripe.accounts.retrieve(stripeConnectAccountId);
  const chargesEnabled = Boolean(stripeAccount.charges_enabled);
  const payoutsEnabled = Boolean(stripeAccount.payouts_enabled);
  const onboardingComplete = chargesEnabled && payoutsEnabled;

  await supabaseAdmin
    .from('mentors')
    .update(
      resolveStripeOnboardingMentorUpdate(mentor.compliance_status, onboardingComplete),
    )
    .eq('id', mentorId);

  return { chargesEnabled, payoutsEnabled };
}
