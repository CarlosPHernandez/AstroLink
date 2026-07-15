import { track } from '@vercel/analytics';
import { resolveChrisPricingTier } from '@/lib/chris-campaign/chris-pricing';
import {
  dwellBucket,
  sanitizeWaitlistRef,
  type WaitlistDwellBucket,
} from '@/lib/waitlist/waitlist-analytics';

/**
 * Chris campaign funnel events (Vercel Analytics).
 * `ref` is early-signups | chris-social | chris-sembroski | direct | …
 */

export type ChrisAnalyticsPage = '/talk-with-chris' | '/booking';

export type ChrisAnalyticsSource = 'early_access' | 'full';

export type ChrisAnalyticsContext = {
  campaign: 'chris';
  ref: string;
  source: ChrisAnalyticsSource;
  page: ChrisAnalyticsPage;
};

export type ChrisAuthMode = 'register' | 'login';

export type ChrisPaymentErrorReason = 'stripe_confirm' | 'book_api' | 'validation';

export type ChrisWizardStep = 'account' | 'session' | 'payment' | 'stripe';

export type ChrisWizardExitOutcome =
  | 'bounce'
  | 'auth_only'
  | 'session_only'
  | 'checkout_started'
  | 'paid';

export function sanitizeChrisCampaignRef(
  ref: string | null | undefined,
): string {
  return sanitizeWaitlistRef(ref ?? undefined);
}

export function buildChrisAnalyticsContext(
  marketingReferrer: string | null | undefined,
  page: ChrisAnalyticsPage,
): ChrisAnalyticsContext {
  const tier = resolveChrisPricingTier(marketingReferrer);
  return {
    campaign: 'chris',
    ref: sanitizeChrisCampaignRef(marketingReferrer),
    source: tier === 'early_access' ? 'early_access' : 'full',
    page,
  };
}

function trackChrisWithContext(
  event: string,
  context: ChrisAnalyticsContext,
  data?: Record<string, string | number | boolean | null>,
) {
  track(event, {
    campaign: context.campaign,
    ref: context.ref,
    source: context.source,
    page: context.page,
    ...data,
  });
}

/** Fired once when /talk-with-chris mounts. */
export function trackChrisLandingView(ref: string | null | undefined) {
  track('chris_landing_view', { ref: sanitizeChrisCampaignRef(ref) });
}

/** Fired when user clicks Request Session / Book Private Session. */
export function trackChrisRequestSession(ref: string | null | undefined) {
  track('chris_request_session', { ref: sanitizeChrisCampaignRef(ref) });
}

/** Fired once when Chris booking wizard mounts. */
export function trackChrisBookingPageView(
  marketingReferrer: string | null | undefined,
  signedIn: boolean,
) {
  const context = buildChrisAnalyticsContext(marketingReferrer, '/booking');
  trackChrisWithContext('chris_booking_page_view', context, { signed_in: signedIn });
}

/** Fired after inline register/login succeeds (not email-confirmation pending). */
export function trackChrisAuthSuccess(
  marketingReferrer: string | null | undefined,
  authMode: ChrisAuthMode,
) {
  const context = buildChrisAnalyticsContext(marketingReferrer, '/booking');
  trackChrisWithContext('chris_auth_success', context, { auth_mode: authMode });
}

/** Fired when user passes session goals step and continues to payment summary. */
export function trackChrisSessionContinue(marketingReferrer: string | null | undefined) {
  const context = buildChrisAnalyticsContext(marketingReferrer, '/booking');
  trackChrisWithContext('chris_session_continue', context);
}

/** Fired when POST /api/book succeeds and checkout is ready. */
export function trackChrisCheckoutStart(
  marketingReferrer: string | null | undefined,
  amountCents: number,
  options?: { skipPayment?: boolean },
) {
  const context = buildChrisAnalyticsContext(marketingReferrer, '/booking');
  trackChrisWithContext('chris_checkout_start', context, {
    amount_cents: amountCents,
    booking_id_present: true,
    skip_payment: options?.skipPayment ?? false,
  });
}

/** Fired when fulfillment reaches next_steps (booking confirmed for the user). */
export function trackChrisCheckoutSuccess(
  marketingReferrer: string | null | undefined,
  amountCents: number,
) {
  const context = buildChrisAnalyticsContext(marketingReferrer, '/booking');
  trackChrisWithContext('chris_checkout_success', context, {
    amount_cents: amountCents,
    booking_id_present: true,
  });
}

export function trackChrisPaymentError(
  marketingReferrer: string | null | undefined,
  reason: ChrisPaymentErrorReason,
) {
  const context = buildChrisAnalyticsContext(marketingReferrer, '/booking');
  trackChrisWithContext('chris_payment_error', context, { reason });
}

export function trackChrisWizardExit(
  marketingReferrer: string | null | undefined,
  lastStep: ChrisWizardStep,
  dwell: WaitlistDwellBucket,
  outcome: ChrisWizardExitOutcome,
) {
  const context = buildChrisAnalyticsContext(marketingReferrer, '/booking');
  trackChrisWithContext('chris_wizard_exit', context, {
    last_step: lastStep,
    dwell_bucket: dwell,
    outcome,
  });
}

export type ChrisWizardProgress = {
  authSuccess: boolean;
  sessionContinued: boolean;
  checkoutStarted: boolean;
  paid: boolean;
};

export function resolveChrisWizardExitOutcome(
  progress: ChrisWizardProgress,
): ChrisWizardExitOutcome {
  if (progress.paid) return 'paid';
  if (progress.checkoutStarted) return 'checkout_started';
  if (progress.sessionContinued) return 'session_only';
  if (progress.authSuccess) return 'auth_only';
  return 'bounce';
}

export { dwellBucket };