'use client';

import { useMemo, useState } from 'react';
import { MaterialIcon } from '@/components/ui/material-icon';
import {
  canNavigateChrisCampaignMonthEarlier,
  canNavigateChrisCampaignMonthLater,
  getChrisCampaignDatesForMonth,
  getChrisCampaignInitialMonth,
  getChrisCampaignMonthLabel,
  shiftChrisCampaignMonth,
} from '@/lib/chris-campaign/chris-campaign-dates';

export function useChrisCampaignDateSelection() {
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

  return {
    activeDate,
    canGoEarlier,
    canGoLater,
    dates,
    goToEarlierMonth,
    goToLaterMonth,
    monthLabel,
    setSelectedDate,
  };
}

type ChrisCampaignDateStripProps = ReturnType<typeof useChrisCampaignDateSelection> & {
  compact?: boolean;
};

export function ChrisCampaignDateStrip({
  activeDate,
  canGoEarlier,
  canGoLater,
  dates,
  goToEarlierMonth,
  goToLaterMonth,
  monthLabel,
  setSelectedDate,
  compact = false,
}: ChrisCampaignDateStripProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`flex items-center justify-between ${compact ? '' : 'px-1'}`}>
        <button
          type="button"
          className="text-outline-variant transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Previous month"
          disabled={!canGoEarlier}
          onClick={goToEarlierMonth}
        >
          <MaterialIcon name="chevron_left" className="text-[18px]" />
        </button>
        <span className="text-xs font-medium uppercase tracking-widest text-white">{monthLabel}</span>
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
      <div
        className={`chris-fade-mask-x flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${compact ? '' : 'px-1'}`}
      >
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
                  ? 'flex h-16 min-w-[3.5rem] shrink-0 -skew-x-[20deg] flex-col items-center justify-center rounded-sm bg-white transition-all'
                  : 'flex h-16 min-w-[3.5rem] shrink-0 -skew-x-[20deg] flex-col items-center justify-center rounded-sm border border-white/30 bg-white/5 backdrop-blur-sm transition-all hover:border-white/60'
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
                      ? 'text-base font-bold text-primary-container'
                      : 'text-base font-bold text-white'
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
      </div>
    </div>
  );
}
