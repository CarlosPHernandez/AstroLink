import { getExpertBookHref } from '@/lib/expert-book-href';
import type { ListedExpert } from '@/lib/mentor-directory';

export type ExpertCtaVariant = 'waitlist' | 'booking';

export type ExpertCta = {
  href: string;
  variant: ExpertCtaVariant;
};

export function getExpertWaitlistCtaHref(slug: string): string {
  return `/early-access?ref=${encodeURIComponent(`expert-${slug}`)}`;
}

/** Primary expert CTA — waitlist early-access link or booking/auth path. */
export function resolveExpertCta(
  slug: string,
  isSignedIn: boolean,
  waitlistMode: boolean,
): ExpertCta {
  if (waitlistMode) {
    return {
      href: getExpertWaitlistCtaHref(slug),
      variant: 'waitlist',
    };
  }
  return {
    href: getExpertBookHref(slug, isSignedIn),
    variant: 'booking',
  };
}

export function expertCtaIcon(variant: ExpertCtaVariant): 'mail' | 'videocam' {
  return variant === 'waitlist' ? 'mail' : 'videocam';
}

export function expertCtaPrimaryLabel(
  variant: ExpertCtaVariant,
  firstName: string,
  rate: number,
): string {
  if (variant === 'waitlist') {
    return 'Get early access';
  }
  return `Book live 1:1 with ${firstName} · $${rate}/hr`;
}

export function expertCtaShortLabel(
  variant: ExpertCtaVariant,
  firstName: string,
  availability: ListedExpert['availability'],
  rate: number,
): string {
  if (variant === 'waitlist') {
    return 'Get early access';
  }
  return `${availability === 'Available Now' ? 'Book session' : 'Schedule'} · $${rate}/hr`;
}