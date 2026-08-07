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
import { toAuthWithRedirect } from '@/lib/auth-redirect';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import BookingClient from './booking-client';
import { SpaBookingWithReportTracker } from '@/components/path-assessment/spa-analytics-effects';

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{
    mentor?: string;
    campaign?: string;
    date?: string;
    ref?: string;
    duration?: string;
    assessment?: string;
  }>;
}) {
  const {
    mentor: mentorSlugParam,
    campaign,
    date,
    ref: refParam,
    duration: durationParam,
    assessment: assessmentTokenParam,
  } = await searchParams;
  const chrisCampaign = isChrisCampaignBookingQuery(campaign);

  const session = await getSession();
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

  // Preserve ?assessment= (and mentor) through auth so free report attaches after signup.
  if (!session) {
    const returnQs = new URLSearchParams();
    if (mentorSlugParam?.trim()) returnQs.set('mentor', mentorSlugParam.trim());
    if (assessmentTokenParam?.trim()) returnQs.set('assessment', assessmentTokenParam.trim());
    if (durationParam?.trim()) returnQs.set('duration', durationParam.trim());
    const returnPath = `/booking${returnQs.toString() ? `?${returnQs.toString()}` : ''}`;
    redirect(toAuthWithRedirect(returnPath));
  }

  const authedSession = session;

  const invalidMentorSlug = mentorSlug && !mentor ? mentorSlug : null;

  const parsedDuration = durationParam ? Number.parseInt(durationParam, 10) : NaN;
  const prefillDurationMinutes = Number.isFinite(parsedDuration)
    ? clampSessionDurationMinutes(parsedDuration)
    : SESSION_DURATION_DEFAULT;

  const compGrant = await getAvailableGrantForUser(authedSession.userId).catch(() => null);

  const assessmentToken = assessmentTokenParam?.trim() || null;

  return (
    <>
      <SpaBookingWithReportTracker enabled={Boolean(assessmentToken)} />
      <BookingClient
        session={authedSession}
        experts={experts}
        mentor={mentor}
        invalidMentorSlug={invalidMentorSlug}
        skipPayments={isStripePaymentsSkipped()}
        chrisCampaign={false}
        prefillScheduledAt={null}
        prefillDurationMinutes={prefillDurationMinutes}
        assessmentToken={assessmentToken}
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
    </>
  );
}
