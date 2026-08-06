import Link from 'next/link';
import { LandingScrollReveal } from '@/components/landing/landing-scroll-reveal';

/**
 * Dedicated offer section for free Space Path Assessment.
 * Placed after Participation, before Benefits.
 */
export function LandingAssessmentOffer() {
  return (
    <section
      id="space-path-assessment"
      className="scroll-mt-20 border-t border-[var(--landing-border)] py-12 sm:py-20 lg:py-24"
      data-testid="landing-assessment-offer"
      aria-labelledby="landing-assessment-offer-heading"
    >
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg">
        <LandingScrollReveal
          as="div"
          variant="up"
          className="mx-auto max-w-[var(--max-width-prose)] text-center"
        >
          <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--landing-faint)]">
            Free readiness report
          </p>
          <h2
            id="landing-assessment-offer-heading"
            className="mt-3 font-landing-display text-[1.5rem] sm:text-[1.875rem] lg:text-[2.125rem] font-semibold tracking-tight text-[var(--landing-text)] leading-[1.2]"
          >
            Find out exactly where you stand — and what to do next
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[var(--landing-muted)] leading-relaxed">
            Answer a few questions about your stage, goals, and obstacles. Get a personalized Space
            Path report on the page and in your email — then book a live expert to review it with
            you.
          </p>
          <div className="mt-7 sm:mt-8 flex flex-col items-center gap-3">
            <Link
              href="/assessment"
              className="inline-flex min-h-12 touch-manipulation items-center justify-center rounded-full bg-[var(--landing-ink)] px-7 text-sm sm:text-[15px] font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-ink)] focus-visible:ring-offset-2"
              data-testid="landing-assessment-offer-cta"
            >
              Get my free Space Path Assessment
            </Link>
            <p className="text-xs sm:text-sm text-[var(--landing-faint)]">
              2–3 minutes · personalized report to your email · no account required
            </p>
          </div>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
