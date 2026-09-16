import { OFFER_PUBLISHED_CAP } from '@/lib/expert-offers/constants';

export type PublishMentor = {
  expert_offers_enabled: boolean;
  stripe_onboarding_completed: boolean;
  compliance_status: string;
  is_listed: boolean;
  slug: string | null;
};

export function publishedCapError(): string {
  return `You can publish up to ${OFFER_PUBLISHED_CAP} sessions. Unpublish one first.`;
}

/** Stripe / listing / flag checks. Cap is enforced atomically in publish_expert_offer. */
export function assertMentorCanPublish(mentor: PublishMentor): string | null {
  if (!mentor.expert_offers_enabled) {
    return 'Packaged sessions are not enabled for this account.';
  }
  if (!mentor.stripe_onboarding_completed) {
    return 'Finish payout setup before publishing a session.';
  }
  if (mentor.compliance_status !== 'approved') {
    return 'Your listing must be approved before publishing.';
  }
  if (!mentor.is_listed) {
    return 'Your listing must be listed and public before publishing.';
  }
  if (!mentor.slug) {
    return 'Add a public profile slug before publishing.';
  }
  return null;
}

export function assertCanPublish(mentor: PublishMentor, publishedCount: number): string | null {
  const blocked = assertMentorCanPublish(mentor);
  if (blocked) return blocked;
  if (publishedCount >= OFFER_PUBLISHED_CAP) {
    return publishedCapError();
  }
  return null;
}

export function canEditSlug(publishedAt: string | null): boolean {
  return publishedAt == null;
}

export function canEditPriceDuration(args: {
  publishedAt: string | null;
  hasPaidBooking: boolean;
}): boolean {
  return !args.hasPaidBooking;
}

export function assertCanArchive(hasUpcomingConfirmed: boolean): string | null {
  if (hasUpcomingConfirmed) {
    return 'This session has an upcoming confirmed booking. Unpublish it instead.';
  }
  return null;
}
