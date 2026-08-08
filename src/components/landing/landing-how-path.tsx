'use client';

import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';
import { trackSpaOfferClick } from '@/lib/path-assessment/path-assessment-analytics';

/**
 * Mid-page reinforcement of the assessment magnet — compact, not a second tall hero.
 */
export function LandingHowPath() {
  return (
    <section
      id="space-path-assessment"
      className="scroll-mt-20 border-t border-[var(--landing-border)] bg-[var(--landing-surface-soft)] py-9 sm:py-12 lg:py-14"
      data-testid="landing-assessment-offer"
      aria-labelledby="landing-how-path-heading"
    >
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-8">
          <div className="min-w-0 max-w-xl">
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--landing-faint)]">
              Free readiness report
            </p>
            <h2
              id="landing-how-path-heading"
              className="mt-2 font-landing-display text-[1.25rem] sm:text-xl lg:text-2xl font-semibold tracking-tight text-[var(--landing-text)] leading-snug text-balance"
            >
              Start free. Get specific. Book only when you&apos;re ready.
            </h2>
            <p className="mt-2 text-sm text-[var(--landing-muted)] leading-relaxed text-pretty">
              Your Space Path Assessment maps gaps and next moves from your answers — then attaches
              to a live expert session or written review if you want depth.
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-stretch sm:items-end gap-2">
            <Link
              href="/assessment"
              onClick={() => trackSpaOfferClick()}
              className="inline-flex min-h-11 touch-manipulation items-center justify-center gap-1.5 rounded-full bg-[var(--landing-ink)] px-5 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-ink)] focus-visible:ring-offset-2"
              data-testid="landing-assessment-offer-cta"
            >
              Start free assessment
              <MaterialIcon name="arrow_forward" size={16} className="text-white" />
            </Link>
            <p className="text-center sm:text-right text-xs text-[var(--landing-faint)]">
              No account · report by email
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
