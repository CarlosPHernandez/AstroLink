import { track } from '@vercel/analytics';
import { sanitizeWaitlistRef } from '@/lib/waitlist/waitlist-analytics';

/**
 * Chris campaign funnel events (Vercel Analytics).
 * `ref` is early-signups | chris-social | chris-sembroski | direct | …
 */

export function sanitizeChrisCampaignRef(
  ref: string | null | undefined,
): string {
  return sanitizeWaitlistRef(ref ?? undefined);
}

/** Fired once when /talk-with-chris mounts. */
export function trackChrisLandingView(ref: string | null | undefined) {
  track('chris_landing_view', { ref: sanitizeChrisCampaignRef(ref) });
}

/** Fired when user clicks Request Session / Book Private Session. */
export function trackChrisRequestSession(ref: string | null | undefined) {
  track('chris_request_session', { ref: sanitizeChrisCampaignRef(ref) });
}
