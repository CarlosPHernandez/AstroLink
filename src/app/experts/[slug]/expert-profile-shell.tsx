import { isWaitlistMode } from '@/lib/app-mode';
import { resolveExpertCta } from '@/lib/expert-cta';
import type { PublicExpertReview } from '@/lib/expert-reviews';
import type { ListedExpert } from '@/lib/mentor-directory';
import { getSession } from '@/lib/session';
import ExpertProfileClient from './expert-profile-client';

export default async function ExpertProfileShell({
  expert,
  reviews = [],
}: {
  expert: ListedExpert;
  reviews?: PublicExpertReview[];
}) {
  const session = await getSession();
  const expertCta = resolveExpertCta(expert.slug, Boolean(session), isWaitlistMode());
  return (
    <ExpertProfileClient
      expert={expert}
      session={session}
      expertCta={expertCta}
      reviews={reviews}
    />
  );
}
