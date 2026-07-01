'use client';

import { ExpertIntroMedia } from '@/components/ExpertIntroMedia';
import { ChrisMobileBookingCard } from '@/components/chris-campaign/chris-mobile-booking-card';
import { ChrisQuestionQueue } from '@/components/chris-campaign/chris-question-queue';
import { ChrisSlotIndicator } from '@/components/chris-campaign/chris-slot-indicator';
import type { ChrisExpertPortraitProps } from '@/components/chris-campaign/chris-expert-portrait';

type ChrisMobileLandingProps = {
  bookingEnabled: boolean;
  expertPortrait: ChrisExpertPortraitProps;
  isSignedIn: boolean;
  marketingReferrer: string | null;
  mentorSlug: string;
  slotCap: number;
  slotsRemaining: number;
};

export function ChrisMobileLanding({
  bookingEnabled,
  expertPortrait,
  isSignedIn,
  marketingReferrer,
  mentorSlug,
  slotCap,
  slotsRemaining,
}: ChrisMobileLandingProps) {
  const soldOut = bookingEnabled && slotsRemaining <= 0;

  return (
    <main
      className="chris-mobile-max relative mx-auto flex w-full flex-grow flex-col overflow-x-hidden pb-12"
      data-testid="chris-mobile-landing"
    >
      <div className="relative h-[50vh] w-full shrink-0 overflow-hidden">
        <div className="chris-portrait-breathe h-full w-full">
          <ExpertIntroMedia
            name={expertPortrait.name}
            imageUrl={expertPortrait.imageUrl}
            introVideoUrl={expertPortrait.introVideoUrl}
            priority
            overlayVariant="minimal"
            className="chris-mobile-hero-media h-full min-h-full w-full rounded-none border-0 bg-primary-container shadow-none [&_img]:object-top [&_video]:object-top"
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-primary-container via-primary-container/20 to-transparent"
          aria-hidden="true"
        />
        <div className="absolute bottom-0 left-0 z-20 flex w-full flex-col gap-3 p-6">
          <ChrisSlotIndicator
            slotCap={slotCap}
            slotsRemaining={slotsRemaining}
            variant="hero"
          />
          <h1 className="chris-text-gradient text-[2rem] font-semibold leading-[1.2] tracking-tight">
            Office hours with verified space operators — not A.I.
          </h1>
        </div>
      </div>

      <div className="relative z-20 -mt-4 flex flex-col gap-4">
        <p className="px-6 text-base font-light leading-relaxed text-secondary-fixed-dim">
          Connect directly with the architects of modern space exploration. Gain unfiltered
          insights from those who have crossed the Kármán line.
        </p>

        <ChrisMobileBookingCard
          bookingEnabled={bookingEnabled}
          isSignedIn={isSignedIn}
          marketingReferrer={marketingReferrer}
          mentorSlug={mentorSlug}
          soldOut={soldOut}
        />

        <div className="px-6">
          <ChrisQuestionQueue variant="scroll" />
        </div>
      </div>
    </main>
  );
}