import { track } from '@vercel/analytics';

export type WaitlistPage = 'early-access' | 'join';

export type WaitlistAnalyticsContext = {
  page: WaitlistPage;
  ref: string;
  expert?: string;
};

export type WaitlistFormStartVia = 'focus' | 'input';

export type WaitlistSubmitFailReason =
  | 'invalid_email_client'
  | 'invalid_email_server'
  | 'rate_limit'
  | 'server_error'
  | 'network';

export type WaitlistPageExitOutcome =
  | 'bounce'
  | 'viewed_only'
  | 'started_form'
  | 'submitted_fail'
  | 'signed_up';

export type WaitlistDwellBucket = '0-10s' | '10-30s' | '30-60s' | '60-120s' | '120s+';

const MAX_REF_LENGTH = 255;

export function sanitizeWaitlistRef(ref: string | undefined): string {
  if (!ref?.trim()) return 'direct';
  return ref.trim().slice(0, MAX_REF_LENGTH);
}

export function dwellBucket(ms: number): WaitlistDwellBucket {
  const seconds = Math.max(0, ms) / 1000;
  if (seconds < 10) return '0-10s';
  if (seconds < 30) return '10-30s';
  if (seconds < 60) return '30-60s';
  if (seconds < 120) return '60-120s';
  return '120s+';
}

function trackWithContext(
  event: string,
  context: WaitlistAnalyticsContext,
  data?: Record<string, string | number | boolean | null>,
) {
  const payload: Record<string, string | number | boolean | null> = {
    page: context.page,
    ref: context.ref,
    ...data,
  };
  if (context.expert) {
    payload.expert = context.expert;
  }
  track(event, payload);
}

export function trackWaitlistIntroPlay(expertSlug: string) {
  track('waitlist_intro_play', { expert: expertSlug });
}

export function trackWaitlistBadEmail(source: 'client' | 'server') {
  track('waitlist_bad_email', { source });
}

export function trackWaitlistRateLimit() {
  track('waitlist_rate_limit');
}

export function trackWaitlistFormView(context: WaitlistAnalyticsContext) {
  trackWithContext('waitlist_form_view', context);
}

export function trackWaitlistFormStart(
  context: WaitlistAnalyticsContext,
  via: WaitlistFormStartVia,
) {
  trackWithContext('waitlist_form_start', context, { via });
}

export function trackWaitlistSubmitAttempt(context: WaitlistAnalyticsContext) {
  trackWithContext('waitlist_submit_attempt', context);
}

export function trackWaitlistSubmitSuccess(
  context: WaitlistAnalyticsContext,
  alreadyRegistered: boolean,
) {
  trackWithContext('waitlist_submit_success', context, { already_registered: alreadyRegistered });
}

export function trackWaitlistSubmitFail(
  context: WaitlistAnalyticsContext,
  reason: WaitlistSubmitFailReason,
) {
  trackWithContext('waitlist_submit_fail', context, { reason });
}

export function trackWaitlistFormAbandon(
  context: WaitlistAnalyticsContext,
  hadTyped: boolean,
  lastFailReason?: WaitlistSubmitFailReason,
) {
  const data: Record<string, string | number | boolean | null> = { had_typed: hadTyped };
  if (lastFailReason) {
    data.last_fail_reason = lastFailReason;
  }
  trackWithContext('waitlist_form_abandon', context, data);
}

export function trackWaitlistPageExit(
  context: WaitlistAnalyticsContext,
  dwell: WaitlistDwellBucket,
  outcome: WaitlistPageExitOutcome,
) {
  trackWithContext('waitlist_page_exit', context, { dwell_bucket: dwell, outcome });
}