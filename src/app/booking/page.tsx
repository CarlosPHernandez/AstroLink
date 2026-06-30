import { isStripePaymentsSkipped } from '@/lib/booking-payments';
import {
  chrisCampaignDateToDatetimeLocal,
  isChrisCampaignBookingQuery,
} from '@/lib/chris-campaign/chris-booking-mode';
import { getChrisMentorSlug } from '@/lib/chris-campaign/chris-campaign-config';
import { getMentorBySlug, listPublicMentors } from '@/lib/mentor-directory';
import { requireSession } from '@/lib/require-session';
import BookingClient from './booking-client';

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ mentor?: string; campaign?: string; date?: string }>;
}) {
  const session = await requireSession();

  const { mentor: mentorSlugParam, campaign, date } = await searchParams;
  const chrisCampaign = isChrisCampaignBookingQuery(campaign);
  const mentorSlug = chrisCampaign ? getChrisMentorSlug() : mentorSlugParam;

  const [experts, mentor] = await Promise.all([
    listPublicMentors(),
    mentorSlug ? getMentorBySlug(mentorSlug) : Promise.resolve(null),
  ]);
  const invalidMentorSlug = mentorSlug && !mentor ? mentorSlug : null;
  const prefillScheduledAt = chrisCampaign && date ? chrisCampaignDateToDatetimeLocal(date) : null;

  return (
    <BookingClient
      session={session}
      experts={experts}
      mentor={mentor}
      invalidMentorSlug={invalidMentorSlug}
      skipPayments={isStripePaymentsSkipped()}
      chrisCampaign={chrisCampaign}
      prefillScheduledAt={prefillScheduledAt}
    />
  );
}