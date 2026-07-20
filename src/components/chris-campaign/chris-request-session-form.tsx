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

type ChrisRequestSessionFormProps = {
  bookingEnabled: boolean;
  isSignedIn: boolean;
  marketingReferrer: string | null;
  mentorSlug: string;
  soldOut: boolean;
  variant?: 'desktop' | 'mobile';
};

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

function ChrisLandingPrice({
  marketingReferrer,
  durationMinutes,
}: {
  marketingReferrer: string | null;
  durationMinutes: number;
}) {
  const chargeCents = resolveChrisChargeCents(marketingReferrer, durationMinutes);
  const originalCents = resolveChrisOriginalPriceCents(durationMinutes);
  const isEarly = resolveChrisPricingTier(marketingReferrer) === 'early_access';

  return (
    <p
      data-testid="chris-landing-price"
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
  );
}

export function ChrisRequestSessionForm({
  bookingEnabled,
  isSignedIn,
  marketingReferrer,
  mentorSlug,
  soldOut,
  variant = 'desktop',
}: ChrisRequestSessionFormProps) {
  const router = useRouter();
  const dateSelection = useChrisCampaignDateSelection();
  const [durationMinutes, setDurationMinutes] = useState(getChrisCampaignDurationMinutes);

  if (!bookingEnabled) {
    return (
      <div className="chris-form-max w-full pt-4">
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
      <div className="chris-form-max w-full pt-4" data-testid="chris-sold-out">
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

  if (variant === 'mobile') {
    return (
      <div className="chris-fade-in-up chris-delay-400 w-full border-t border-white/10 pt-6">
        <div className="flex w-full flex-col gap-4">
          <p className="text-xs font-medium uppercase tracking-widest text-on-tertiary-container/80">
            Choose your 1:1 call
          </p>
          <ChrisCampaignDateStrip {...dateSelection} />
          <DurationStepper value={durationMinutes} onChange={setDurationMinutes} />
          <ChrisLandingPrice
            marketingReferrer={marketingReferrer}
            durationMinutes={durationMinutes}
          />
          <button
            type="button"
            onClick={handleBook}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-on-tertiary-fixed-variant px-4 py-4 text-xs font-semibold uppercase tracking-widest text-on-tertiary shadow-[0_0_20px_rgba(11,62,164,0.4)] backdrop-blur-sm transition-all duration-150 hover:bg-on-tertiary-fixed-variant/90 active:scale-[0.98]"
            data-testid="chris-request-session"
          >
            <span>Book Private Session</span>
            <MaterialIcon name="arrow_forward" className="text-[18px]" />
          </button>
          <p className="text-center text-[10px] font-medium uppercase tracking-widest text-outline/40">
            Sessions are scheduled based on availability. Approval required.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="chris-fade-in-up chris-delay-400 chris-form-max w-full pt-4">
      <div className="flex w-full flex-col space-y-4">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-widest text-on-tertiary-container/80">
            Choose your date
          </p>
          <ChrisCampaignDateStrip {...dateSelection} compact />
        </div>
        <DurationStepper value={durationMinutes} onChange={setDurationMinutes} />
        <ChrisLandingPrice
          marketingReferrer={marketingReferrer}
          durationMinutes={durationMinutes}
        />
        <button
          type="button"
          onClick={handleBook}
          className="chris-hover-glow relative mt-2 w-full overflow-hidden rounded-lg bg-secondary-fixed px-6 py-4 text-sm font-semibold text-tertiary-container transition-all duration-300 hover:bg-white"
          data-testid="chris-request-session"
        >
          <span className="relative z-10">Request Session</span>
          <div
            className="chris-shimmer pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
            aria-hidden="true"
          />
        </button>
        <p className="mt-3 text-center text-xs font-light text-secondary-fixed-dim/70">
          Confidential 1-on-1 sessions · 15–60 minutes.
        </p>
      </div>
    </div>
  );
}
