import { isStripePaymentsSkipped } from '@/lib/booking-payments';
import {
  isChrisCampaignBookingQuery,
  resolveChrisPrefillScheduledAt,
} from '@/lib/chris-campaign/chris-booking-mode';
import { getChrisMentorSlug } from '@/lib/chris-campaign/chris-campaign-config';
import { parseChrisCampaignReferrer } from '@/lib/chris-campaign/chris-campaign-referrer';
import { ChrisBookingWizard } from '@/components/chris-campaign/chris-booking-wizard';
import { getMentorBySlug, listPublicMentors } from '@/lib/mentor-directory';
import { clampSessionDurationMinutes, SESSION_DURATION_DEFAULT } from '@/lib/session-duration';
import { getAvailableGrantForUser } from '@/lib/session-comp-grants';
import { getSession } from '@/lib/session';
import { requireSession } from '@/lib/require-session';
import { redirect } from 'next/navigation';
import BookingClient from './booking-client';

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{
    mentor?: string;
    campaign?: string;
    date?: string;
    ref?: string;
    duration?: string;
  }>;
}) {
  const {
    mentor: mentorSlugParam,
    campaign,
    date,
    ref: refParam,
    duration: durationParam,
  } = await searchParams;
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

    const prefillScheduledAt = resolveChrisPrefillScheduledAt(date);
    const prefillDate = prefillScheduledAt ? (date?.trim() || null) : null;
    const marketingReferrer = parseChrisCampaignReferrer(refParam ? `?ref=${refParam}` : '');
    const parsedDuration = durationParam ? Number.parseInt(durationParam, 10) : NaN;
    const prefillDurationMinutes = Number.isFinite(parsedDuration)
      ? clampSessionDurationMinutes(parsedDuration)
      : undefined;

    return (
      <ChrisBookingWizard
        session={session}
        mentor={mentor}
        marketingReferrer={marketingReferrer ?? null}
        prefillScheduledAt={prefillScheduledAt}
        prefillDate={prefillDate}
        prefillDurationMinutes={prefillDurationMinutes}
      />
    );
  }

  if (!session) {
    redirect('/auth');
  }

  const invalidMentorSlug = mentorSlug && !mentor ? mentorSlug : null;

  const parsedDuration = durationParam ? Number.parseInt(durationParam, 10) : NaN;
  const prefillDurationMinutes = Number.isFinite(parsedDuration)
    ? clampSessionDurationMinutes(parsedDuration)
    : SESSION_DURATION_DEFAULT;

  const compGrant = await getAvailableGrantForUser(session.userId).catch(() => null);

  return (
    <BookingClient
      session={session}
      experts={experts}
      mentor={mentor}
      invalidMentorSlug={invalidMentorSlug}
      skipPayments={isStripePaymentsSkipped()}
      chrisCampaign={false}
      prefillScheduledAt={null}
      prefillDurationMinutes={prefillDurationMinutes}
      initialCompGrant={
        compGrant
          ? {
              id: compGrant.id,
              creditMinutes: compGrant.creditMinutes,
              expiresAt: compGrant.expiresAt,
            }
          : null
      }
    />
  );
}
