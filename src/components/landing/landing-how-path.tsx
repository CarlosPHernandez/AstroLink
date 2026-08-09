'use client';

import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';
import { trackSpaOfferClick } from '@/lib/path-assessment/path-assessment-analytics';

/**
 * Mid-page assessment reinforce — horizontal CTA strip.
 * DESIGN.md: the single allowed soft accent wash strip.
 */
export function LandingHowPath() {
  return (
    <section
      id="space-path-assessment"
      className="scroll-mt-20 border-t border-[var(--landing-accent-border)] bg-[var(--landing-accent-soft)] py-4 sm:py-5"
      data-testid="landing-assessment-offer"
      aria-labelledby="landing-how-path-heading"
    >
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg">
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="inline-flex shrink-0 items-center rounded-full bg-[var(--landing-accent)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-white font-mono leading-none">
              Free
            </span>
            <h2
              id="landing-how-path-heading"
              className="font-landing-display text-sm sm:text-base font-semibold tracking-tight text-[var(--landing-text)] leading-none"
            >
              Space Path Assessment
            </h2>
            <span
              className="hidden h-3.5 w-px shrink-0 bg-[var(--landing-accent-border)] sm:block"
              aria-hidden
            />
            <p className="text-xs sm:text-sm text-[var(--landing-muted)] leading-none">
              2–3 min · report by email · no account
            </p>
          </div>

          <Link
            href="/assessment"
            onClick={() => trackSpaOfferClick()}
            className="inline-flex min-h-10 sm:min-h-9 w-full sm:w-auto touch-manipulation items-center justify-center gap-1 rounded-full bg-[var(--landing-accent)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--landing-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)] focus-visible:ring-offset-2"
            data-testid="landing-assessment-offer-cta"
          >
            Start free assessment
            <MaterialIcon name="arrow_forward" size={16} className="text-white" />
          </Link>
        </div>
      </div>
    </section>
  );
}
