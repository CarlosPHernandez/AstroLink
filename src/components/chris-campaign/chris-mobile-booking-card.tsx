'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { MaterialIcon } from '@/components/ui/material-icon';
import { getChrisBookingEntryHref } from '@/lib/chris-campaign/chris-booking-href';
import {
  canNavigateChrisCampaignMonthEarlier,
  canNavigateChrisCampaignMonthLater,
  getChrisCampaignDatesForMonth,
  getChrisCampaignInitialMonth,
  getChrisCampaignMonthLabel,
  shiftChrisCampaignMonth,
} from '@/lib/chris-campaign/chris-campaign-dates';

type ChrisMobileBookingCardProps = {
  bookingEnabled: boolean;
  isSignedIn: boolean;
  mentorSlug: string;
  soldOut: boolean;
};

export function ChrisMobileBookingCard({
  bookingEnabled,
  isSignedIn,
  mentorSlug,
  soldOut,
}: ChrisMobileBookingCardProps) {
  const router = useRouter();
  const initialMonth = useMemo(() => getChrisCampaignInitialMonth(), []);
  const [month, setMonth] = useState(initialMonth);
  const dates = useMemo(
    () => getChrisCampaignDatesForMonth(month.year, month.monthIndex),
    [month.monthIndex, month.year],
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const activeDate = selectedDate ?? dates[0]?.isoDate ?? null;
  const monthLabel = getChrisCampaignMonthLabel(month.year, month.monthIndex);
  const canGoEarlier = canNavigateChrisCampaignMonthEarlier(month.year, month.monthIndex);
  const canGoLater = canNavigateChrisCampaignMonthLater(month.year, month.monthIndex);

  if (!bookingEnabled) {
    return (
      <div className="chris-glass-card rounded-none border-white/10 px-6 py-4 shadow-2xl">
        <p className="text-sm font-light text-secondary-fixed-dim/80">
          Booking is not open yet.{' '}
          <Link
            href="/early-access?ref=chris-sembroski"
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
          All Chris Sembroski sessions are currently reserved. Check back if a spot opens.
        </p>
      </div>
    );
  }

  function handleBook() {
    router.push(getChrisBookingEntryHref(mentorSlug, isSignedIn));
  }

  function goToEarlierMonth() {
    if (!canGoEarlier) return;
    setMonth((current) => shiftChrisCampaignMonth(current.year, current.monthIndex, -1));
    setSelectedDate(null);
  }

  function goToLaterMonth() {
    if (!canGoLater) return;
    setMonth((current) => shiftChrisCampaignMonth(current.year, current.monthIndex, 1));
    setSelectedDate(null);
  }

  return (
    <div
      className="chris-glass-card mb-4 flex flex-col gap-4 border-white/10 py-4 shadow-2xl"
      data-testid="chris-mobile-booking-card"
    >
      <div className="flex flex-col gap-2">
        <p className="px-4 text-xs font-medium uppercase tracking-widest text-outline-variant/70">
          Choose your 1:1 call
        </p>
        <div className="mt-2 mb-1 flex items-center justify-between px-4">
          <button
            type="button"
            className="text-outline-variant transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Previous month"
            disabled={!canGoEarlier}
            onClick={goToEarlierMonth}
          >
            <MaterialIcon name="chevron_left" className="text-[18px]" />
          </button>
          <span className="text-xs font-medium uppercase tracking-widest text-white">
            {monthLabel}
          </span>
          <button
            type="button"
            className="text-outline-variant transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next month"
            disabled={!canGoLater}
            onClick={goToLaterMonth}
          >
            <MaterialIcon name="chevron_right" className="text-[18px]" />
          </button>
        </div>
        <div className="chris-fade-mask-x flex gap-2 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {dates.map((date) => {
            const selected = activeDate === date.isoDate;
            return (
              <button
                key={date.isoDate}
                type="button"
                aria-pressed={selected}
                onClick={() => setSelectedDate(date.isoDate)}
                className={
                  selected
                    ? 'flex h-20 min-w-[4rem] shrink-0 -skew-x-[20deg] flex-col items-center justify-center rounded-sm bg-white transition-all'
                    : 'flex h-20 min-w-[4rem] shrink-0 -skew-x-[20deg] flex-col items-center justify-center rounded-sm border border-white/30 bg-white/5 backdrop-blur-sm transition-all hover:border-white/60'
                }
              >
                <div className="flex skew-x-[20deg] flex-col items-center">
                  <span
                    className={
                      selected
                        ? 'text-[10px] font-bold uppercase tracking-widest text-primary-container'
                        : 'text-[10px] uppercase tracking-widest text-outline-variant'
                    }
                  >
                    {date.month}
                  </span>
                  <span
                    className={
                      selected
                        ? 'text-lg font-bold text-primary-container'
                        : 'text-lg font-bold text-white'
                    }
                  >
                    {date.day}
                  </span>
                  <span
                    className={
                      selected
                        ? 'text-[10px] font-bold text-primary-container/80'
                        : 'text-[10px] text-white/60'
                    }
                  >
                    {date.weekday}
                  </span>
                </div>
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleBook}
            className="flex h-20 min-w-[4rem] shrink-0 -skew-x-[20deg] flex-col items-center justify-center rounded-sm border border-white/30 bg-white/5 backdrop-blur-sm transition-all hover:border-white/60"
            aria-label="View all dates"
          >
            <div className="flex skew-x-[20deg] flex-col items-center">
              <MaterialIcon name="calendar_month" className="mb-1 text-[20px] text-white" />
              <span className="text-center text-[8px] uppercase tracking-widest text-outline-variant">
                View All
              </span>
            </div>
          </button>
        </div>
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