import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';
import { LandingScrollReveal } from '@/components/landing/landing-scroll-reveal';

/**
 * Dedicated offer section for free Space Path Assessment.
 * Placed after Participation, before Benefits.
 */
export function LandingAssessmentOffer() {
  return (
    <section
      id="space-path-assessment"
      className="scroll-mt-20 border-t border-[var(--landing-border)] py-10 sm:py-16 lg:py-20"
      data-testid="landing-assessment-offer"
      aria-labelledby="landing-assessment-offer-heading"
    >
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg">
        <LandingScrollReveal as="div" variant="up" className="mx-auto max-w-[920px]">
          <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)] p-5 sm:p-8 lg:p-10 shadow-[0_16px_48px_-32px_rgba(14,20,32,0.22)]">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-6 sm:gap-8 lg:gap-10 items-center">
              <div className="text-center lg:text-left min-w-0">
                <p className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--landing-faint)]">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]"
                    aria-hidden
                  />
                  Free readiness report
                </p>
                <h2
                  id="landing-assessment-offer-heading"
                  className="mt-3 font-landing-display text-[1.375rem] sm:text-[1.75rem] lg:text-[2rem] font-semibold tracking-tight text-[var(--landing-text)] leading-[1.2] text-balance"
                >
                  Find out exactly where you stand — and what to do next
                </h2>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-[var(--landing-muted)] leading-relaxed max-w-prose mx-auto lg:mx-0 text-pretty">
                  Answer a few questions about your stage, goals, and obstacles. Get a personalized
                  report on the page and by email — then, if you want depth, review it live with a
                  verified expert.
                </p>
                <div className="mt-6 sm:mt-7 flex flex-col items-stretch sm:items-center lg:items-start gap-2.5 sm:gap-3">
                  <Link
                    href="/assessment"
                    className="inline-flex min-h-11 sm:min-h-12 w-full sm:w-auto max-w-full touch-manipulation items-center justify-center gap-1.5 rounded-full bg-[var(--landing-ink)] px-5 sm:px-6 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-ink)] focus-visible:ring-offset-2"
                    data-testid="landing-assessment-offer-cta"
                  >
                    Start free assessment
                    <MaterialIcon name="arrow_forward" size={16} className="text-white shrink-0" />
                  </Link>
                  <p className="text-center lg:text-left text-xs sm:text-sm text-[var(--landing-faint)] leading-snug">
                    Free · 2–3 min · personalized report · no account
                  </p>
                </div>
              </div>

              <ul className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5 sm:gap-3 text-left">
                {[
                  {
                    title: 'Where you stand',
                    body: 'A clear snapshot from your answers — not generic career advice.',
                  },
                  {
                    title: 'Your real gaps',
                    body: '2–3 specific gaps vs your goal, plus focus areas.',
                  },
                  {
                    title: 'What to do next',
                    body: 'Three solo actions — then optional live expert review.',
                  },
                ].map((item) => (
                  <li
                    key={item.title}
                    className="rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface-soft)] px-3.5 py-3 sm:px-4 sm:py-3.5 min-w-0"
                  >
                    <p className="text-sm font-semibold text-[var(--landing-text)]">{item.title}</p>
                    <p className="mt-1 text-xs sm:text-sm text-[var(--landing-muted)] leading-relaxed">
                      {item.body}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
