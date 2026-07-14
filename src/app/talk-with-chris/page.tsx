import type { Metadata } from 'next';
import { ChrisLandingClient } from '@/components/chris-campaign/chris-landing-client';
import {
  getChrisCampaignId,
  getChrisMentorSlug,
  getChrisSlotCapFromEnv,
  isChrisBookingEnabled,
} from '@/lib/chris-campaign/chris-campaign-config';
import { parseChrisCampaignReferrer } from '@/lib/chris-campaign/chris-campaign-referrer';
import { getChrisCampaignSlotSnapshot } from '@/lib/chris-campaign/chris-campaign-slots';
import { getMentorBySlug } from '@/lib/mentor-directory';
import { DEFAULT_MENTOR_IMAGE } from '@/lib/public-images';
import { getSession } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Private 45-Minute Session with Astronaut Chris Sembroski',
  description:
    'Guaranteed 1:1 access with Inspiration4 astronaut Chris Sembroski. No stage, no audience — direct answers to your goals in a full 45-minute private session.',
  robots: { index: false, follow: false },
};

export default async function TalkWithChrisPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref: refParam } = await searchParams;
  const marketingReferrer = parseChrisCampaignReferrer(refParam ? `?ref=${refParam}` : '');
  const bookingEnabled = isChrisBookingEnabled();
  const mentorSlug = getChrisMentorSlug();
  const [session, expert] = await Promise.all([getSession(), getMentorBySlug(mentorSlug)]);
  const slotCapDefault = getChrisSlotCapFromEnv();

  let slotCap = slotCapDefault;
  let slotsRemaining = slotCapDefault;

  if (bookingEnabled) {
    try {
      const snapshot = await getChrisCampaignSlotSnapshot(getChrisCampaignId());
      if (snapshot) {
        slotCap = snapshot.slotCap;
        slotsRemaining = snapshot.slotsRemaining;
      }
    } catch {
      // Fall back to env cap when DB is unreachable (e.g. local without migration).
    }
  }

  return (
    <ChrisLandingClient
      bookingEnabled={bookingEnabled}
      copyrightYear={new Date().getFullYear()}
      expertPortrait={{
        name: expert?.name ?? 'Chris Sembroski',
        imageUrl: expert?.imageUrl ?? DEFAULT_MENTOR_IMAGE,
        introVideoUrl: expert?.introVideoUrl ?? null,
        subtitle: expert?.role ?? 'Commercial Astronaut',
      }}
      isSignedIn={session !== null}
      marketingReferrer={marketingReferrer ?? null}
      mentorSlug={mentorSlug}
      slotCap={slotCap}
      slotsRemaining={slotsRemaining}
    />
  );
}
