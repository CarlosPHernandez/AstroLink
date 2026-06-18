import { track } from '@vercel/analytics';

export function trackWaitlistIntroPlay(expertSlug: string) {
  track('waitlist_intro_play', { expert: expertSlug });
}

export function trackWaitlistBadEmail(source: 'client' | 'server') {
  track('waitlist_bad_email', { source });
}

export function trackWaitlistRateLimit() {
  track('waitlist_rate_limit');
}