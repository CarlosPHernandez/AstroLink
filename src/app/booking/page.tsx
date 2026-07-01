import { isStripePaymentsSkipped } from '@/lib/booking-payments';
import {
  chrisCampaignDateToDatetimeLocal,
  isChrisCampaignBookingQuery,
} from '@/lib/chris-campaign/chris-booking-mode';
import { getChrisMentorSlug } from '@/lib/chris-campaign/chris-campaign-config';
import { ChrisBookingWizard } from '@/components/chris-campaign/chris-booking-wizard';
import { getMentorBySlug, listPublicMentors } from '@/lib/mentor-directory';
import { getSession } from '@/lib/session';
import { requireSession } from '@/lib/require-session';
import { redirect } from 'next/navigation';
import BookingClient from './booking-client';

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ mentor?: string; campaign?: string; date?: string }>;
}) {
  const { mentor: mentorSlugParam, campaign, date } = await searchParams;
  const chrisCampaign = isChrisCampaignBookingQuery(campaign);

  const session = chrisCampaign ? await getSession() : await requireSession();

  const mentorSlug = chrisCampaign ? getChrisMentorSlug() : mentorSlugParam;

  const [experts, mentor] = await Promise.all([
    listPublicMentors(),
    mentorSlug ? getMentorBySlug(mentorSlug) : Promise.resolve(null),
  ]);

  if (chrisCampaign) {
    if (!mentor) {
      redirect('/talk-with-chris');
    }

    const prefillScheduledAt = date ? chrisCampaignDateToDatetimeLocal(date) : null;

    return (
      <ChrisBookingWizard
        session={session}
        mentor={mentor}
        prefillScheduledAt={prefillScheduledAt}
        prefillDate={date?.trim() || null}
      />
    );
  }

  if (!session) {
    redirect('/auth');
  }

  const invalidMentorSlug = mentorSlug && !mentor ? mentorSlug : null;

  return (
    <BookingClient
      session={session}
      experts={experts}
      mentor={mentor}
      invalidMentorSlug={invalidMentorSlug}
      skipPayments={isStripePaymentsSkipped()}
      chrisCampaign={false}
      prefillScheduledAt={null}
    />
  );
}
