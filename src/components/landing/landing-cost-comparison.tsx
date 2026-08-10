import { LandingScrollReveal } from '@/components/landing/landing-scroll-reveal';

const CONFERENCE_ROWS = [
  { label: 'Registration', value: '$500–$2,500' },
  { label: 'Flights + hotel', value: '$300–$2,000' },
  { label: 'Meals & incidentals', value: '$50–$150/day' },
] as const;

const ASTROLINK_ROWS = [
  { label: 'Flights, hotel, time off', value: '$0' },
  { label: 'Chance of meeting the right person', value: 'You pick them' },
  { label: 'Time with your expert', value: 'Dedicated, 1:1' },
] as const;

export function LandingCostComparison() {
  return (
    <section className="py-10 sm:py-16 lg:py-20">
      <div className="max-w-[1100px] mx-auto px-md sm:px-lg">
        <p className="text-center text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--landing-faint)] mb-2">
          Do the math
        </p>
        <h2 className="text-center font-landing-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--landing-text)] mb-3">
          One conference ticket. Zero guarantees.
        </h2>
        <p className="text-center text-sm sm:text-base text-[var(--landing-muted)] max-w-[60ch] mx-auto mb-9 sm:mb-10">
          Industry estimates put the all-in cost of attending a single conference —
          registration, flights, hotel, meals — at roughly $1,500 to $2,500, averaging around
          $1,600. And none of that buys you real time with the specific person you traveled to
          meet.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-[900px] mx-auto">
          <LandingScrollReveal
            as="div"
            variant="left"
            className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)] p-6 sm:p-7"
          >
            <span className="inline-block rounded-full bg-[var(--landing-surface-soft)] px-2.5 py-1 text-[11px] font-bold tracking-[0.06em] text-[var(--landing-muted)] mb-4">
              THE CONFERENCE ROUTE
            </span>
            <ul className="text-sm text-[var(--landing-text)] mb-4">
              {CONFERENCE_ROWS.map((row) => (
                <li
                  key={row.label}
                  className="flex justify-between border-b border-[var(--landing-border)] py-2.5 last:border-b-0"
                >
                  <span>{row.label}</span>
                  <span className="text-[var(--landing-muted)]">{row.value}</span>
                </li>
              ))}
            </ul>
            <p className="text-[15px] font-bold text-[var(--landing-text)] mb-1.5">
              ≈ $1,600 average, per event
            </p>
            <p className="text-[13px] leading-relaxed text-[var(--landing-muted)]">
              Plus days away from work, and no guarantee the person you wanted to meet has time
              for you in a crowded hallway.
            </p>
          </LandingScrollReveal>

          <LandingScrollReveal
            as="div"
            variant="right"
            className="rounded-2xl border border-[var(--landing-accent)] bg-[var(--landing-surface)] p-6 sm:p-7 shadow-[0_16px_40px_-24px_rgba(24,89,212,0.35)]"
          >
            <span className="inline-block rounded-full bg-[var(--landing-accent)] px-2.5 py-1 text-[11px] font-bold tracking-[0.06em] text-white mb-4">
              THE ASTROLINK ROUTE
            </span>
            <ul className="text-sm text-[var(--landing-text)] mb-4">
              {ASTROLINK_ROWS.map((row) => (
                <li
                  key={row.label}
                  className="flex justify-between border-b border-[var(--landing-border)] py-2.5 last:border-b-0"
                >
                  <span>{row.label}</span>
                  <span className="font-semibold text-[var(--landing-accent)]">{row.value}</span>
                </li>
              ))}
            </ul>
            <p className="text-[15px] font-bold text-[var(--landing-text)] mb-1.5">
              One session. No travel bill.
            </p>
            <p className="text-[13px] leading-relaxed text-[var(--landing-muted)]">
              Book the exact expert you want, from wherever you are, for a fraction of what one
              conference costs.
            </p>
          </LandingScrollReveal>
        </div>
      </div>
    </section>
  );
}
