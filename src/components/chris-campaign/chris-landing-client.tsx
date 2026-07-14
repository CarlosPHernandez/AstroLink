'use client';

import './chris-landing.css';

import {
  ChrisExpertPortrait,
  type ChrisExpertPortraitProps,
} from '@/components/chris-campaign/chris-expert-portrait';
import { ChrisMobileLanding } from '@/components/chris-campaign/chris-mobile-landing';
import { ChrisLandingFooter } from '@/components/chris-campaign/chris-landing-footer';
import { ChrisQuestionQueue } from '@/components/chris-campaign/chris-question-queue';
import { ChrisRequestSessionForm } from '@/components/chris-campaign/chris-request-session-form';
import { ChrisSlotIndicator } from '@/components/chris-campaign/chris-slot-indicator';
import { showChrisSlotScarcity } from '@/lib/chris-campaign/chris-pricing';

type ChrisLandingClientProps = {
  bookingEnabled: boolean;
  copyrightYear: number;
  expertPortrait: ChrisExpertPortraitProps;
  isSignedIn: boolean;
  marketingReferrer: string | null;
  mentorSlug: string;
  slotCap: number;
  slotsRemaining: number;
};

export function ChrisLandingClient({
  bookingEnabled,
  copyrightYear,
  expertPortrait,
  isSignedIn,
  marketingReferrer,
  mentorSlug,
  slotCap,
  slotsRemaining,
}: ChrisLandingClientProps) {
  const showSlots = showChrisSlotScarcity(marketingReferrer);
  // Server still enforces cap for all refs; UI sold-out only when scarcity is shown.
  const soldOut = bookingEnabled && slotsRemaining <= 0;

  return (
    <div className="chris-landing flex min-h-screen flex-col font-sans text-white selection:bg-tertiary-container selection:text-white">
      {/* Phone only (<768px). Tablet and up use the HUD desktop layout below. */}
      <div className="md:hidden">
        <ChrisMobileLanding
          bookingEnabled={bookingEnabled}
          expertPortrait={expertPortrait}
          isSignedIn={isSignedIn}
          marketingReferrer={marketingReferrer}
          mentorSlug={mentorSlug}
          slotCap={slotCap}
          slotsRemaining={slotsRemaining}
          showSlotScarcity={showSlots}
        />
      </div>

      <div className="hidden flex-1 flex-col md:flex">
        <nav
          className="mx-auto flex w-full max-w-[80rem] items-center justify-between px-6 py-6 md:px-10 md:py-8 lg:px-12"
          aria-label="Campaign"
        />

        <main className="relative flex flex-1 flex-grow items-center justify-center overflow-hidden px-6 py-10 md:px-10 md:py-16 lg:px-12 lg:py-20">
          <div
            className="flex w-full max-w-[80rem] flex-col items-center justify-center gap-10 md:items-start md:gap-12 lg:flex-row lg:items-center lg:gap-24"
            data-testid="chris-landing-row"
          >
            <div className="z-10 flex w-full max-w-[42rem] flex-col items-center space-y-8 text-center md:items-start md:space-y-10 md:text-left lg:w-[50%]">
              <div className="flex w-full flex-col items-center space-y-6 md:items-start">
                {showSlots ? (
                  <ChrisSlotIndicator slotCap={slotCap} slotsRemaining={slotsRemaining} />
                ) : null}
                <h1 className="chris-fade-in-up chris-delay-200 chris-copy-max w-full text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-[2.5rem] lg:text-6xl">
                  Private 45-Minute Session with Astronaut Chris Sembroski
                </h1>
                <p className="chris-fade-in-up chris-delay-250 chris-copy-max w-full text-base font-medium leading-snug text-white/90 sm:text-lg">
                  Guaranteed 1:1 access. No stage. No audience. Just direct answers to your goals.
                </p>
                <p className="chris-fade-in-up chris-delay-300 chris-copy-max w-full text-lg font-light leading-relaxed text-secondary-fixed-dim">
                  Most people spend $1,500+ traveling to events hoping for a few minutes with someone
                  who&apos;s actually been to space. You get a full guaranteed 45 minutes — with Chris
                  prepared on your specific goals before the call.
                </p>
              </div>

              <ChrisRequestSessionForm
                bookingEnabled={bookingEnabled}
                isSignedIn={isSignedIn}
                marketingReferrer={marketingReferrer}
                mentorSlug={mentorSlug}
                soldOut={soldOut}
              />

              <ChrisQuestionQueue />
            </div>

            <ChrisExpertPortrait {...expertPortrait} />
          </div>
        </main>
      </div>

      {/* Shared footer — was desktop-only, so mobile ended abruptly after the queue. */}
      <ChrisLandingFooter copyrightYear={copyrightYear} />
    </div>
  );
}
