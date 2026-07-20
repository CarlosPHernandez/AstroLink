'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DurationStepper } from '@/components/experts/duration-stepper';
import { MaterialIcon } from '@/components/ui/material-icon';
import {
  ChrisCampaignDateStrip,
  useChrisCampaignDateSelection,
} from '@/components/chris-campaign/chris-campaign-date-strip';
import { saveDraft } from '@/lib/chris-campaign/chris-booking-draft';
import { getChrisCampaignDurationMinutes } from '@/lib/chris-campaign/chris-booking-mode';
import { getChrisBookingEntryHref } from '@/lib/chris-campaign/chris-booking-href';
import { trackChrisRequestSession } from '@/lib/chris-campaign/chris-campaign-analytics';
import {
  CHRIS_PUBLIC_REFERRER,
  CHRIS_WAITLIST_EMAIL_REFERRER,
} from '@/lib/chris-campaign/chris-campaign-referrer';
import {
  resolveChrisChargeCents,
  resolveChrisOriginalPriceCents,
  resolveChrisPricingTier,
} from '@/lib/chris-campaign/chris-pricing';
import { getChrisWaitlistHref } from '@/lib/chris-campaign/chris-waitlist-href';

type ChrisMobileBookingCardProps = {
  bookingEnabled: boolean;
  isSignedIn: boolean;
  marketingReferrer: string | null;
  mentorSlug: string;
  soldOut: boolean;
};

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

export function ChrisMobileBookingCard({
  bookingEnabled,
  isSignedIn,
  marketingReferrer,
  mentorSlug,
  soldOut,
}: ChrisMobileBookingCardProps) {
  const router = useRouter();
  const dateSelection = useChrisCampaignDateSelection();
  const [durationMinutes, setDurationMinutes] = useState(getChrisCampaignDurationMinutes);

  const chargeCents = resolveChrisChargeCents(marketingReferrer, durationMinutes);
  const originalCents = resolveChrisOriginalPriceCents(durationMinutes);
  const isEarly = resolveChrisPricingTier(marketingReferrer) === 'early_access';

  if (!bookingEnabled) {
    return (
      <div className="chris-glass-card rounded-none border-white/10 px-6 py-4 shadow-2xl">
        <p className="text-sm font-light text-secondary-fixed-dim/80">
          Booking is not open yet.{' '}
          <Link
            href={getChrisWaitlistHref(CHRIS_PUBLIC_REFERRER)}
            className="text-tertiary-fixed-dim underline-offset-4 hover:underline"
          >
            Join the waitlist
          </Link>{' '}
          to get notified.
        </p>
      </div>
    );
  }

  if (soldOut) {
    return (
      <div
        className="chris-glass-card rounded-none border-white/10 px-6 py-4 shadow-2xl"
        data-testid="chris-sold-out"
      >
        <p className="text-sm font-light text-secondary-fixed-dim/80">
          All Chris Sembroski sessions are currently reserved.{' '}
          <Link
            href={getChrisWaitlistHref(CHRIS_WAITLIST_EMAIL_REFERRER)}
            className="text-tertiary-fixed-dim underline-offset-4 hover:underline"
          >
            Join the waitlist
          </Link>{' '}
          for the next wave.
        </p>
      </div>
    );
  }

  function handleBook() {
    trackChrisRequestSession(marketingReferrer);
    const date = dateSelection.activeDate ?? null;
    const scheduledAt = date ? `${date}T12:00` : '';
    saveDraft({
      durationMinutes,
      date,
      scheduledAt,
      marketingReferrer,
    });
    router.push(
      getChrisBookingEntryHref(mentorSlug, isSignedIn, {
        date: dateSelection.activeDate ?? undefined,
        ref: marketingReferrer,
        durationMinutes,
      }),
    );
  }

  return (
    <div
      className="mb-4 flex flex-col gap-4 border-0 bg-transparent py-4 shadow-none"
      data-testid="chris-mobile-booking-card"
    >
      <div className="flex flex-col gap-2 px-4">
        <p className="text-xs font-medium uppercase tracking-widest text-outline-variant/70">
          Choose your 1:1 call
        </p>
        <ChrisCampaignDateStrip {...dateSelection} compact />
        <DurationStepper value={durationMinutes} onChange={setDurationMinutes} />
        <p
          data-testid="chris-landing-price-mobile"
          className="text-sm font-medium text-white/90"
          aria-live="polite"
        >
          {isEarly && originalCents > chargeCents ? (
            <>
              <span className="mr-2 text-white/50 line-through">{formatMoney(originalCents)}</span>
              <span>
                {formatMoney(chargeCents)} early access · {durationMinutes} min
              </span>
            </>
          ) : (
            <span>
              {formatMoney(chargeCents)} · {durationMinutes} min
            </span>
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={handleBook}
        className="mx-4 flex items-center justify-center gap-3 rounded-lg bg-white px-4 py-4 text-xs font-semibold uppercase tracking-widest text-primary-container shadow-lg shadow-white/10 transition-all duration-150 hover:bg-white/90 active:scale-[0.98]"
        data-testid="chris-request-session"
        aria-label="Submit booking request for a private session"
      >
        <span>Book Private Session</span>
        <MaterialIcon name="arrow_forward" className="text-[18px] text-primary-container" />
      </button>
      <p className="px-4 text-center text-[10px] tracking-wide text-outline/60">
        Sessions are scheduled based on availability. Approval required.
      </p>
    </div>
  );
}
