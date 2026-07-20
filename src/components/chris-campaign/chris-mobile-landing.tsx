'use client';

import { useState } from 'react';
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
  /** Early-access waitlist only — hide for Chris social / full price. */
  showSlotScarcity?: boolean;
};

export function ChrisMobileLanding({
  bookingEnabled,
  expertPortrait,
  isSignedIn,
  marketingReferrer,
  mentorSlug,
  slotCap,
  slotsRemaining,
  showSlotScarcity = true,
}: ChrisMobileLandingProps) {
  // Cap is shared; always block booking when sold out even if scarcity UI is hidden.
  const soldOut = bookingEnabled && slotsRemaining <= 0;
  const [videoPlaying, setVideoPlaying] = useState(false);

  return (
    <main
      className="chris-mobile-max relative mx-auto flex w-full flex-grow flex-col overflow-x-hidden pb-6"
      data-testid="chris-mobile-landing"
    >
      <div className="relative h-[min(62vh,36rem)] w-full shrink-0 overflow-hidden sm:h-[min(64vh,40rem)]">
        <div className={`h-full w-full ${videoPlaying ? '' : 'chris-portrait-breathe'}`}>
          <ExpertIntroMedia
            name={expertPortrait.name}
            imageUrl={expertPortrait.imageUrl}
            introVideoUrl={expertPortrait.introVideoUrl}
            priority
            overlayVariant="minimal"
            onPlayingChange={setVideoPlaying}
            className="chris-mobile-hero-media h-full min-h-full w-full rounded-none border-0 bg-primary-container shadow-none [&_img]:object-top [&_video]:object-top"
          />
        </div>
        <div
          className={`chris-hero-scrim pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-primary-container via-primary-container/25 to-transparent ${
            videoPlaying ? 'chris-hero-scrim--hidden' : ''
          }`}
          aria-hidden="true"
        />
        <div
          className={`chris-hero-copy pointer-events-none absolute bottom-0 left-0 z-20 flex w-full flex-col gap-3 p-6 ${
            videoPlaying ? 'chris-hero-copy--playing' : ''
          }`}
          aria-hidden={videoPlaying}
          data-testid="chris-mobile-hero-copy"
        >
          {showSlotScarcity ? (
            <div className="chris-hero-copy-line chris-hero-copy-line--0">
              <ChrisSlotIndicator
                slotCap={slotCap}
                slotsRemaining={slotsRemaining}
                variant="hero"
              />
            </div>
          ) : null}
          {/* Mobile: short hero only — long value copy steals vertical space from Chris media. */}
          <h1 className="chris-hero-copy-line chris-hero-copy-line--1 chris-text-gradient text-[1.65rem] font-semibold leading-[1.15] tracking-tight sm:text-[2rem] sm:leading-[1.2]">
            Private 1:1 session with Astronaut Chris Sembroski
          </h1>
          <p className="chris-hero-copy-line chris-hero-copy-line--2 text-sm font-medium leading-snug text-white/90">
            Guaranteed 1:1 access. No stage. No audience. Just direct answers to your goals.
          </p>
        </div>
      </div>

      <div className="relative z-20 -mt-6 flex flex-col gap-3 pb-4">
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
