'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MaterialIcon } from '@/components/ui/material-icon';
import {
  ChrisCampaignDateStrip,
  useChrisCampaignDateSelection,
} from '@/components/chris-campaign/chris-campaign-date-strip';
import { getChrisBookingEntryHref } from '@/lib/chris-campaign/chris-booking-href';
import {
  CHRIS_PUBLIC_REFERRER,
  CHRIS_WAITLIST_EMAIL_REFERRER,
} from '@/lib/chris-campaign/chris-campaign-referrer';
import { getChrisWaitlistHref } from '@/lib/chris-campaign/chris-waitlist-href';

type ChrisMobileBookingCardProps = {
  bookingEnabled: boolean;
  isSignedIn: boolean;
  marketingReferrer: string | null;
  mentorSlug: string;
  soldOut: boolean;
};

export function ChrisMobileBookingCard({
  bookingEnabled,
  isSignedIn,
  marketingReferrer,
  mentorSlug,
  soldOut,
}: ChrisMobileBookingCardProps) {
  const router = useRouter();
  const dateSelection = useChrisCampaignDateSelection();

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
    router.push(
      getChrisBookingEntryHref(mentorSlug, isSignedIn, {
        date: dateSelection.activeDate ?? undefined,
        ref: marketingReferrer,
      }),
    );
  }

  return (
    <div
      className="chris-glass-card mb-4 flex flex-col gap-4 border-white/10 py-4 shadow-2xl"
      data-testid="chris-mobile-booking-card"
    >
      <div className="flex flex-col gap-2 px-4">
        <p className="text-xs font-medium uppercase tracking-widest text-outline-variant/70">
          Choose your 1:1 call
        </p>
        <ChrisCampaignDateStrip {...dateSelection} />
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
