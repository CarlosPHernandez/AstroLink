'use client';

import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';
import { trackSpaOfferClick } from '@/lib/path-assessment/path-assessment-analytics';

/**
 * Free assessment CTA — centered bordered card (2026-08 redesign).
 */
export function LandingHowPath() {
  return (
    <section
      id="space-path-assessment"
      className="scroll-mt-20 py-10 sm:py-16 lg:py-20"
      aria-labelledby="landing-how-path-heading"
    >
      <div className="max-w-[720px] mx-auto px-md sm:px-lg text-center">
        <div
          className="rounded-3xl border border-[var(--landing-border)] bg-[var(--landing-surface)] px-7 py-10 sm:px-12 sm:py-14 shadow-[0_20px_52px_-30px_rgba(14,20,32,0.18)]"
          data-testid="landing-assessment-offer"
        >
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--landing-accent)] mb-2.5">
            Free readiness report
          </p>
          <h2
            id="landing-how-path-heading"
            className="font-landing-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--landing-text)] mb-3"
          >
            Find out where you stand.
          </h2>
          <p className="text-sm sm:text-base text-[var(--landing-muted)] max-w-[50ch] mx-auto mb-7">
            Answer a few questions about your goals and get a personalized readiness report in
            under three minutes — free, no account required.
          </p>
          <Link
            href="/assessment"
            onClick={() => trackSpaOfferClick()}
            className="inline-flex min-h-12 touch-manipulation items-center justify-center gap-1.5 rounded-full bg-[var(--landing-ink)] px-7 text-sm font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)] focus-visible:ring-offset-2"
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
