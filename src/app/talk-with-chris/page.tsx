import type { Metadata } from 'next';
import { ChrisLandingClient } from '@/components/chris-campaign/chris-landing-client';
import {
  getChrisCampaignId,
  getChrisMentorSlug,
  getChrisSlotCapFromEnv,
  isChrisBookingEnabled,
} from '@/lib/chris-campaign/chris-campaign-config';
import { getChrisCampaignSlotSnapshot } from '@/lib/chris-campaign/chris-campaign-slots';
import { getMentorBySlug } from '@/lib/mentor-directory';
import { DEFAULT_MENTOR_IMAGE } from '@/lib/public-images';
import { getSession } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Talk with Chris Sembroski',
  description:
    'Book a limited live session with Inspiration4 astronaut and space engineer Chris Sembroski.',
  robots: { index: false, follow: false },
};

export default async function TalkWithChrisPage() {
  const bookingEnabled = isChrisBookingEnabled();
  const mentorSlug = getChrisMentorSlug();
  const [session, expert] = await Promise.all([getSession(), getMentorBySlug(mentorSlug)]);
  const slotCapDefault = getChrisSlotCapFromEnv();

  let slotCap = slotCapDefault;
  let slotsReserved = 0;
  let slotsRemaining = slotCapDefault;

  if (bookingEnabled) {
    try {
      const snapshot = await getChrisCampaignSlotSnapshot(getChrisCampaignId());
      if (snapshot) {
        slotCap = snapshot.slotCap;
        slotsReserved = snapshot.slotsReserved;
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
      mentorSlug={mentorSlug}
      slotCap={slotCap}
      slotsRemaining={slotsRemaining}
    />
  );
}