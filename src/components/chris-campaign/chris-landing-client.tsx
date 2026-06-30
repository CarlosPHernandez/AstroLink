'use client';

import './chris-landing.css';

import {
  ChrisExpertPortrait,
  type ChrisExpertPortraitProps,
} from '@/components/chris-campaign/chris-expert-portrait';
import { ChrisLandingFooter } from '@/components/chris-campaign/chris-landing-footer';
import { ChrisQuestionQueue } from '@/components/chris-campaign/chris-question-queue';
import { ChrisRequestSessionForm } from '@/components/chris-campaign/chris-request-session-form';
import { ChrisSlotIndicator } from '@/components/chris-campaign/chris-slot-indicator';

type ChrisLandingClientProps = {
  bookingEnabled: boolean;
  copyrightYear: number;
  expertPortrait: ChrisExpertPortraitProps;
  isSignedIn: boolean;
  mentorSlug: string;
  slotCap: number;
  slotsRemaining: number;
};

export function ChrisLandingClient({
  bookingEnabled,
  copyrightYear,
  expertPortrait,
  isSignedIn,
  mentorSlug,
  slotCap,
  slotsRemaining,
}: ChrisLandingClientProps) {
  const soldOut = bookingEnabled && slotsRemaining <= 0;

  return (
    <div className="chris-landing flex min-h-screen flex-col font-sans text-white selection:bg-tertiary-container selection:text-white">
      <nav
        className="mx-auto flex w-full max-w-[80rem] items-center justify-between px-6 py-8 md:px-12"
        aria-label="Campaign"
      />

      <main className="relative flex flex-grow items-center justify-center overflow-hidden px-6 py-12 md:px-12 md:py-20">
        <div
          className="flex w-full max-w-[80rem] flex-col items-center justify-center gap-12 lg:flex-row lg:items-center lg:gap-24"
          data-testid="chris-landing-row"
        >
          <div className="z-10 flex w-full max-w-[42rem] flex-col items-center space-y-10 text-center lg:w-1/2 lg:items-start lg:text-left">
            <div className="flex w-full flex-col items-center space-y-6 lg:items-start">
              <ChrisSlotIndicator slotCap={slotCap} slotsRemaining={slotsRemaining} />
              <h1 className="chris-fade-in-up chris-delay-200 chris-copy-max w-full text-4xl font-semibold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">
                Office hours with verified space operators — not A.I.
              </h1>
              <p className="chris-fade-in-up chris-delay-300 chris-copy-max w-full text-lg font-light leading-relaxed text-secondary-fixed-dim">
                Connect directly with the architects of modern space exploration. Gain unfiltered
                insights from those who have crossed the Kármán line.
              </p>
            </div>

            <ChrisRequestSessionForm
              bookingEnabled={bookingEnabled}
              isSignedIn={isSignedIn}
              mentorSlug={mentorSlug}
              soldOut={soldOut}
            />

            <ChrisQuestionQueue />
          </div>

          <ChrisExpertPortrait {...expertPortrait} />
        </div>
      </main>

      <ChrisLandingFooter copyrightYear={copyrightYear} />
    </div>
  );
}