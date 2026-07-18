'use client';

import '@/components/chris-campaign/chris-landing.css';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { ExpertIntroMedia } from '@/components/ExpertIntroMedia';
import {
  ChrisExpertPortrait,
  type ChrisExpertPortraitProps,
} from '@/components/chris-campaign/chris-expert-portrait';
import { ChrisLandingFooter } from '@/components/chris-campaign/chris-landing-footer';
import { MaterialIcon } from '@/components/ui/material-icon';
import {
  CHRIS_SLOT_TIME_ZONE,
  type ChrisAvailabilityBlock,
  type ChrisDayKey,
  type ChrisSlotOffer,
  generateSlotsForBlock,
  generateSlotsForBlocks,
  isChrisDayKey,
  wallTimeInTimeZoneToUtc,
} from '@/lib/chris-campaign/chris-availability-slots';
import { CHRIS_SESSION_DURATION_MINUTES } from '@/lib/chris-campaign/chris-campaign-constants';
import { getDashboardPathForRole } from '@/lib/dashboard-paths';

type Phase = 'pick' | 'success' | 'error';

type ChrisSlotPickerProps = {
  token: string;
  blocks: ChrisAvailabilityBlock[];
  initialDayKey: ChrisDayKey | null;
  expertPortrait: ChrisExpertPortraitProps;
  copyrightYear: number;
};

type DayTile = {
  dayKey: ChrisDayKey;
  isoDate: string;
  month: string;
  day: string;
  weekday: string;
  slotCount: number;
  block: ChrisAvailabilityBlock;
};

function buildDayTiles(blocks: ChrisAvailabilityBlock[]): DayTile[] {
  return blocks.map((block) => {
    const noon = wallTimeInTimeZoneToUtc(block.isoDate, 12, 0);
    const month = new Intl.DateTimeFormat('en-US', {
      timeZone: CHRIS_SLOT_TIME_ZONE,
      month: 'short',
    })
      .format(noon)
      .toUpperCase()
      .slice(0, 3);
    const day = new Intl.DateTimeFormat('en-US', {
      timeZone: CHRIS_SLOT_TIME_ZONE,
      day: 'numeric',
    }).format(noon);
    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone: CHRIS_SLOT_TIME_ZONE,
      weekday: 'short',
    })
      .format(noon)
      .toUpperCase()
      .slice(0, 3);
    const slotCount = generateSlotsForBlock(block, CHRIS_SESSION_DURATION_MINUTES).length;
    return {
      dayKey: block.dayKey,
      isoDate: block.isoDate,
      month,
      day,
      weekday,
      slotCount,
      block,
    };
  });
}

/**
 * Slot reschedule UI — reuses talk-with-chris landing shell, date-strip tiles,
 * and request-session CTA patterns. Avoid max-w-sm|md|lg|xl (spacing token collision).
 */
export function ChrisSlotPicker({
  token,
  blocks,
  initialDayKey,
  expertPortrait,
  copyrightYear,
}: ChrisSlotPickerProps) {
  const dayTiles = useMemo(() => buildDayTiles(blocks), [blocks]);
  const allSlots = useMemo(
    () => generateSlotsForBlocks(blocks, CHRIS_SESSION_DURATION_MINUTES),
    [blocks],
  );

  const defaultDay =
    initialDayKey && dayTiles.some((t) => t.dayKey === initialDayKey)
      ? initialDayKey
      : (dayTiles[0]?.dayKey ?? null);

  const [activeDay, setActiveDay] = useState<ChrisDayKey | null>(defaultDay);
  const [selected, setSelected] = useState<ChrisSlotOffer | null>(null);
  const [phase, setPhase] = useState<Phase>('pick');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successLabel, setSuccessLabel] = useState<string | null>(null);

  const activeBlock = dayTiles.find((t) => t.dayKey === activeDay)?.block ?? null;
  const daySlots = useMemo(() => {
    if (!activeBlock) return [];
    return generateSlotsForBlock(activeBlock, CHRIS_SESSION_DURATION_MINUTES);
  }, [activeBlock]);

  async function confirmSelection() {
    if (!selected) return;
    setSaving(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/chris-slot-choice', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token,
          startUtcIso: selected.startUtcIso,
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { success?: boolean; error?: string; data?: { label?: string } }
        | null;
      if (!res.ok || !json?.success) {
        setErrorMessage(json?.error || 'Something went wrong. Please try again.');
        setPhase('error');
        setSaving(false);
        return;
      }
      setSuccessLabel(json.data?.label ?? selected.label);
      setPhase('success');
    } catch {
      setErrorMessage('Network error. Please try again.');
      setPhase('error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="chris-landing flex min-h-screen flex-col font-sans text-white selection:bg-tertiary-container selection:text-white">
      {/* ——— Mobile (<768) ——— */}
      <div className="md:hidden" data-testid="chris-slot-picker">
        <div className="chris-mobile-max relative mx-auto flex w-full flex-grow flex-col overflow-x-hidden pb-8">
          <div className="relative h-[42vh] w-full shrink-0 overflow-hidden">
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
              className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-primary-container via-primary-container/30 to-transparent"
              aria-hidden
            />
          </div>

          <div className="relative z-20 -mt-6 flex flex-col gap-5 px-0 pb-4">
            <div className="px-6">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-secondary-fixed-dim">
                Private session · reschedule
              </p>
              <h1 className="chris-text-gradient text-[1.65rem] font-semibold leading-[1.15] tracking-tight">
                {phase === 'success'
                  ? 'You’re set with Chris'
                  : 'Pick a new 45-minute time'}
              </h1>
              <p className="mt-2 text-sm font-medium leading-snug text-white/90">
                {phase === 'success'
                  ? 'Chris is looking forward to meeting you.'
                  : 'Something came up on Monday — choose a day and start time below.'}
              </p>
            </div>

            {phase === 'pick' || phase === 'error' ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 px-4">
                  <p className="px-1 text-xs font-medium uppercase tracking-widest text-outline-variant/70">
                    Choose your day
                  </p>
                  <DayStrip
                    tiles={dayTiles}
                    activeDay={activeDay}
                    onSelect={(key) => {
                      setActiveDay(key);
                      setSelected(null);
                      setPhase('pick');
                    }}
                  />
                </div>

                <div className="px-4">
                  <p className="mb-3 px-1 text-xs font-medium uppercase tracking-widest text-outline-variant/70">
                    Choose your time · 45 min · Pacific
                  </p>
                  <TimeGrid
                    slots={daySlots}
                    selected={selected}
                    onSelect={(slot) => {
                      setSelected(slot);
                      setPhase('pick');
                    }}
                  />
                </div>

                {phase === 'error' && (
                  <p className="px-6 text-sm text-red-300" data-testid="chris-slot-error">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="button"
                  disabled={!selected || saving}
                  data-testid="chris-slot-confirm-submit"
                  onClick={() => void confirmSelection()}
                  className="mx-4 flex items-center justify-center gap-3 rounded-lg bg-white px-4 py-4 text-xs font-semibold uppercase tracking-widest text-primary-container shadow-lg shadow-white/10 transition-all duration-150 hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>{saving ? 'Saving…' : 'Confirm session time'}</span>
                  <MaterialIcon
                    name="arrow_forward"
                    className="text-[18px] text-primary-container"
                  />
                </button>
                {selected && (
                  <p className="px-6 text-center text-[11px] text-secondary-fixed-dim">
                    {selected.label}
                  </p>
                )}
                <p className="px-4 text-center text-[10px] tracking-wide text-outline/60">
                  {allSlots.length} open starts · reply to your email if none work
                </p>
              </div>
            ) : (
              <SuccessPanel
                successLabel={successLabel}
                onChange={() => {
                  setSuccessLabel(null);
                  setSelected(null);
                  setPhase('pick');
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* ——— Desktop HUD (≥768) ——— */}
      <div className="hidden flex-1 flex-col md:flex" data-testid="chris-slot-picker-desktop">
        <nav
          className="mx-auto flex w-full max-w-[80rem] items-center justify-between px-6 py-6 md:px-10 md:py-8 lg:px-12"
          aria-label="Campaign"
        >
          <Link
            href="/talk-with-chris"
            className="text-sm font-bold tracking-tight text-secondary-fixed-dim transition-colors hover:text-white"
          >
            AstroLink
          </Link>
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-outline-variant/70">
            Reschedule · 45 min
          </span>
        </nav>

        <main className="relative flex flex-1 flex-grow items-center justify-center overflow-hidden px-6 py-10 md:px-10 md:py-14 lg:px-12 lg:py-16">
          <div className="flex w-full max-w-[80rem] flex-col items-center justify-center gap-10 md:items-start md:gap-12 lg:flex-row lg:items-center lg:gap-20">
            <div className="z-10 flex w-full max-w-[42rem] flex-col items-center space-y-8 text-center md:items-start md:space-y-8 md:text-left lg:w-[48%]">
              <div className="flex w-full flex-col items-center space-y-5 md:items-start">
                <p className="chris-fade-in-up text-[10px] font-medium uppercase tracking-[0.2em] text-secondary-fixed-dim">
                  Private session · Chris Sembroski
                </p>
                <h1 className="chris-fade-in-up chris-delay-200 chris-copy-max w-full text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-[2.5rem] lg:text-5xl">
                  {phase === 'success'
                    ? 'You’re set with Chris'
                    : 'Pick a new 45-minute time'}
                </h1>
                <p className="chris-fade-in-up chris-delay-250 chris-copy-max w-full text-base font-medium leading-snug text-white/90 sm:text-lg">
                  {phase === 'success'
                    ? 'Chris is looking forward to meeting you.'
                    : 'Something came up on Chris’s side for Monday — totally on us. Choose any open day and start time.'}
                </p>
                <p className="chris-fade-in-up chris-delay-300 chris-copy-max w-full text-base font-light leading-relaxed text-secondary-fixed-dim">
                  Same private 1:1 session. Same prep, brief, and follow-up. Just a
                  different start time that works for Chris this week.
                </p>
              </div>

              {phase === 'success' ? (
                <div className="chris-fade-in-up chris-delay-400 chris-form-max w-full pt-2">
                  <SuccessPanel
                    successLabel={successLabel}
                    onChange={() => {
                      setSuccessLabel(null);
                      setSelected(null);
                      setPhase('pick');
                    }}
                    alignStart
                  />
                </div>
              ) : (
                <div className="chris-fade-in-up chris-delay-400 chris-form-max w-full pt-2">
                  <div className="flex w-full flex-col space-y-5">
                    <div className="flex flex-col gap-3">
                      <p className="text-xs font-medium uppercase tracking-widest text-on-tertiary-container/80">
                        Choose your day
                      </p>
                      <DayStrip
                        tiles={dayTiles}
                        activeDay={activeDay}
                        onSelect={(key) => {
                          setActiveDay(key);
                          setSelected(null);
                          setPhase('pick');
                        }}
                      />
                    </div>

                    <div className="flex flex-col gap-3">
                      <p className="text-xs font-medium uppercase tracking-widest text-on-tertiary-container/80">
                        Choose your time · 45 min · Pacific
                      </p>
                      <TimeGrid
                        slots={daySlots}
                        selected={selected}
                        onSelect={(slot) => {
                          setSelected(slot);
                          setPhase('pick');
                        }}
                      />
                    </div>

                    {phase === 'error' && (
                      <p className="text-sm text-red-300" data-testid="chris-slot-error">
                        {errorMessage}
                      </p>
                    )}

                    <button
                      type="button"
                      disabled={!selected || saving}
                      data-testid="chris-slot-confirm-submit"
                      onClick={() => void confirmSelection()}
                      className="chris-hover-glow relative mt-1 w-full overflow-hidden rounded-lg bg-secondary-fixed px-6 py-4 text-sm font-semibold text-tertiary-container transition-all duration-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="relative z-10">
                        {saving ? 'Saving…' : 'Confirm session time'}
                      </span>
                      <div
                        className="chris-shimmer pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        aria-hidden="true"
                      />
                    </button>
                    {selected ? (
                      <p className="text-center text-xs font-light text-secondary-fixed-dim/80">
                        {selected.label}
                      </p>
                    ) : (
                      <p className="text-center text-xs font-light text-secondary-fixed-dim/70">
                        Confidential 45-minute 1-on-1 · {allSlots.length} open starts
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <ChrisExpertPortrait {...expertPortrait} />
          </div>
        </main>
      </div>

      <ChrisLandingFooter copyrightYear={copyrightYear} />
    </div>
  );
}

function DayStrip({
  tiles,
  activeDay,
  onSelect,
}: {
  tiles: DayTile[];
  activeDay: ChrisDayKey | null;
  onSelect: (key: ChrisDayKey) => void;
}) {
  return (
    <div
      className="chris-fade-mask-x flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      data-testid="chris-slot-day-list"
    >
      {tiles.map((tile) => {
        const selected = activeDay === tile.dayKey;
        return (
          <button
            key={tile.dayKey}
            type="button"
            aria-pressed={selected}
            data-testid={`chris-slot-day-${tile.dayKey}`}
            onClick={() => onSelect(tile.dayKey)}
            className={
              selected
                ? 'flex h-16 min-w-[3.75rem] shrink-0 -skew-x-[20deg] flex-col items-center justify-center rounded-sm bg-white transition-all'
                : 'flex h-16 min-w-[3.75rem] shrink-0 -skew-x-[20deg] flex-col items-center justify-center rounded-sm border border-white/30 bg-white/5 backdrop-blur-sm transition-all hover:border-white/60'
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
                {tile.month}
              </span>
              <span
                className={
                  selected
                    ? 'text-base font-bold text-primary-container'
                    : 'text-base font-bold text-white'
                }
              >
                {tile.day}
              </span>
              <span
                className={
                  selected
                    ? 'text-[10px] font-bold text-primary-container/80'
                    : 'text-[10px] text-white/60'
                }
              >
                {tile.weekday}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function TimeGrid({
  slots,
  selected,
  onSelect,
}: {
  slots: ChrisSlotOffer[];
  selected: ChrisSlotOffer | null;
  onSelect: (slot: ChrisSlotOffer) => void;
}) {
  if (slots.length === 0) {
    return (
      <p className="text-sm font-light text-secondary-fixed-dim/80">No times this day.</p>
    );
  }

  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
      data-testid="chris-slot-time-list"
    >
      {slots.map((slot) => {
        const isOn = selected?.startUtcIso === slot.startUtcIso;
        return (
          <button
            key={slot.startUtcIso}
            type="button"
            data-testid="chris-slot-time"
            aria-pressed={isOn}
            onClick={() => onSelect(slot)}
            className={
              isOn
                ? 'rounded-lg bg-white px-2 py-3 text-center text-[12px] font-semibold leading-tight text-primary-container transition-all'
                : 'rounded-lg border border-white/20 bg-white/5 px-2 py-3 text-center text-[12px] font-medium leading-tight text-white transition-all hover:border-white/50 hover:bg-white/10'
            }
          >
            {slot.timeRangeLabel}
          </button>
        );
      })}
    </div>
  );
}

function SuccessPanel({
  successLabel,
  onChange,
  alignStart = false,
}: {
  successLabel: string | null;
  onChange: () => void;
  alignStart?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-4 px-6 md:px-0 ${alignStart ? 'items-start text-left' : 'items-center text-center'}`}
      data-testid="chris-slot-success"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
        <MaterialIcon name="check" className="text-[28px] text-[#b4c5ff]" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-secondary-fixed-dim">
          Confirmed
        </p>
        <p className="mt-2 text-lg font-semibold text-white">{successLabel}</p>
        <p className="mt-2 text-sm font-light leading-relaxed text-secondary-fixed-dim">
          You’ll get join details by email closer to the session.
        </p>
      </div>
      <Link
        href={getDashboardPathForRole('mentee')}
        className="chris-hover-glow relative inline-flex w-full max-w-[20rem] items-center justify-center overflow-hidden rounded-lg bg-secondary-fixed px-6 py-4 text-sm font-semibold text-tertiary-container transition-all duration-300 hover:bg-white"
        data-testid="chris-slot-dashboard"
      >
        View my dashboard
      </Link>
      <button
        type="button"
        className="text-sm font-light text-tertiary-fixed-dim underline-offset-4 hover:underline"
        onClick={onChange}
      >
        Change time
      </button>
    </div>
  );
}

export function parseInitialDayKey(value: string | null | undefined): ChrisDayKey | null {
  if (!value) return null;
  return isChrisDayKey(value) ? value : null;
}
