import { track } from '@vercel/analytics';

/**
 * Space Path Assessment funnel events (Vercel Web Analytics).
 * Never send email, names, tokens, or other PII in props.
 */

export type SpaSurface = 'bar' | 'offer' | 'hero' | 'results' | 'form' | 'written' | 'booking';

export type SpaSubmitFailReason = 'validation' | 'rate_limit' | 'server' | 'network' | 'ignored';

function safeTrack(
  event: string,
  data?: Record<string, string | number | boolean | null>,
): void {
  try {
    track(event, data);
  } catch {
    // Analytics must never break product UX
  }
}

export function trackSpaBarClick() {
  safeTrack('spa_bar_click', { surface: 'bar' });
}

export function trackSpaOfferClick() {
  safeTrack('spa_offer_click', { surface: 'offer' });
}

export function trackSpaHeroLinkClick() {
  safeTrack('spa_hero_link_click', { surface: 'hero' });
}

export function trackSpaFormView() {
  safeTrack('spa_form_view', { surface: 'form' });
}

export function trackSpaFormStep(step: number) {
  const n = Math.max(1, Math.min(6, Math.floor(step)));
  safeTrack('spa_form_step', { surface: 'form', step: n });
}

export function trackSpaFormSubmitAttempt() {
  safeTrack('spa_form_submit_attempt', { surface: 'form' });
}

export function trackSpaFormSubmitSuccess() {
  safeTrack('spa_form_submit_success', { surface: 'form' });
}

export function trackSpaFormSubmitFail(reason: SpaSubmitFailReason) {
  safeTrack('spa_form_submit_fail', { surface: 'form', reason });
}

export function trackSpaResultsView() {
  safeTrack('spa_results_view', { surface: 'results' });
}

export function trackSpaCtaLiveClick(surface: SpaSurface = 'results') {
  safeTrack('spa_cta_live_click', { surface });
}

export function trackSpaCtaWrittenClick(surface: SpaSurface = 'results') {
  safeTrack('spa_cta_written_click', { surface });
}

export function trackSpaWrittenCheckoutView() {
  safeTrack('spa_written_checkout_view', { surface: 'written' });
}

export function trackSpaWrittenCheckoutStart() {
  safeTrack('spa_written_checkout_start', { surface: 'written' });
}

export function trackSpaWrittenCheckoutSuccess(skipStripe: boolean) {
  safeTrack('spa_written_checkout_success', { surface: 'written', skip_stripe: skipStripe });
}

export function trackSpaWrittenCheckoutFail(reason: string) {
  safeTrack('spa_written_checkout_fail', {
    surface: 'written',
    reason: reason.slice(0, 40),
  });
}

export function trackSpaBookingWithReportView() {
  safeTrack('spa_booking_with_report_view', { surface: 'booking', has_assessment: true });
}

/** Map API/client failures to a small enum for analytics. */
export function classifySpaSubmitFail(status: number, message: string): SpaSubmitFailReason {
  if (status === 429) return 'rate_limit';
  if (status === 400) return 'validation';
  if (status === 0 || /network|fetch/i.test(message)) return 'network';
  return 'server';
}
