import type { ServiceType } from '@/lib/types';

/** Standalone pre-call brief package price (USD cents). Used for the "pre_call_brief" service type only. */
export const PRE_CALL_BRIEF_ADDON_CENTS = 7500;

/**
 * Prorate an hourly rate (in cents) to a specific duration in minutes.
 * Enforces 15-minute minimum. Used for variable-length 1:1 sessions.
 * live_session_price_cents on mentors is interpreted as the hourly rate.
 */
export function computeDurationPriceCents(hourlyRateCents: number, minutes: number): number {
  const safeMinutes = Math.max(15, Math.min(120, Math.floor(minutes || 15)));
  const perMinute = Math.round(hourlyRateCents / 60);
  return perMinute * safeMinutes;
}

/** Marketplace label: hourly cents prorated to a 15-minute increment. */
export function formatFifteenMinuteRate(hourlyRateCents: number): string {
  const cents = computeDurationPriceCents(hourlyRateCents, 15);
  const dollars = cents / 100;
  const amount = Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2);
  return `$${amount} / 15 min`;
}

export function computeBookingTotalCents(params: {
  serviceType: ServiceType;
  liveSessionPriceCents: number;
  includePreCallBrief: boolean;
  durationMinutes?: number;
}): number {
  if (params.serviceType === 'extended_session') {
    throw new Error('extended_session is not available in D1');
  }

  if (params.serviceType === 'pre_call_brief') {
    return PRE_CALL_BRIEF_ADDON_CENTS;
  }

  // Variable duration for live 1:1 sessions (slider in summary card).
  // liveSessionPriceCents is the hourly rate; brief is bundled (per launch polish).
  if (params.durationMinutes != null) {
    return computeDurationPriceCents(params.liveSessionPriceCents, params.durationMinutes);
  }

  // Fallback (legacy / pre-slider): fixed mentor rate for the session (brief included).
  return params.liveSessionPriceCents;
}
