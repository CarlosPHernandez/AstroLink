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
  const showWas = isEarly && originalCents > chargeCents;

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

  const priceChip = (
    <p
      data-testid="chris-landing-price-mobile"
      className="chris-price-chip"
      aria-live="polite"
    >
      {showWas ? (
        <span className="chris-price-chip__was">{formatMoney(originalCents)}</span>
      ) : null}
      <span className="chris-price-chip__now">{formatMoney(chargeCents)}</span>
      {isEarly ? <span className="chris-price-chip__tag">early</span> : null}
    </p>
  );

  return (
    <div
      className="mb-3 flex flex-col gap-3 border-0 bg-transparent px-4 py-3 shadow-none"
      data-testid="chris-mobile-booking-card"
    >
      <div className="chris-session-config">
        <p className="chris-session-config__label">Choose your 1:1 call</p>
        <div className="chris-session-config__block">
          <ChrisCampaignDateStrip {...dateSelection} compact />
          <DurationStepper
            value={durationMinutes}
            onChange={setDurationMinutes}
            compact
            headerEnd={priceChip}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleBook}
        className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3.5 text-xs font-semibold uppercase tracking-widest text-primary-container shadow-lg shadow-white/10 transition-all duration-150 hover:bg-white/90 active:scale-[0.98]"
        data-testid="chris-request-session"
        aria-label="Submit booking request for a private session"
      >
        <span>Book Private Session</span>
        <MaterialIcon name="arrow_forward" className="text-[18px] text-primary-container" />
      </button>
      <p className="chris-session-config__footnote px-0">
        Scheduled on availability · Approval required
      </p>
    </div>
  );
}
