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
        <LandingScrollReveal as="div" variant="up" className="mx-auto max-w-[920px]">
          <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)] p-6 sm:p-10 lg:p-12 shadow-[0_16px_48px_-32px_rgba(14,20,32,0.22)]">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)] gap-8 lg:gap-12 items-center">
              <div className="text-center lg:text-left">
                <p className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--landing-faint)]">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]" />
                  Free readiness report
                </p>
                <h2
                  id="landing-assessment-offer-heading"
                  className="mt-3 font-landing-display text-[1.5rem] sm:text-[1.875rem] lg:text-[2.125rem] font-semibold tracking-tight text-[var(--landing-text)] leading-[1.2]"
                >
                  Find out exactly where you stand — and what to do next
                </h2>
                <p className="mt-4 text-sm sm:text-base text-[var(--landing-muted)] leading-relaxed max-w-prose mx-auto lg:mx-0">
                  Answer a few questions about your stage, goals, and obstacles. Get a personalized
                  Space Path report on the page and in your email — then book a live expert to
                  review it with you.
                </p>
                <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3">
                  <Link
                    href="/assessment"
                    className="inline-flex min-h-12 w-full sm:w-auto touch-manipulation items-center justify-center rounded-full bg-[var(--landing-ink)] px-7 text-sm sm:text-[15px] font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-ink)] focus-visible:ring-offset-2"
                    data-testid="landing-assessment-offer-cta"
                  >
                    Get my free Space Path Assessment
                  </Link>
                  <p className="text-xs sm:text-sm text-[var(--landing-faint)] sm:self-center">
                    2–3 minutes · no account required
                  </p>
                </div>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 text-left">
                {[
                  {
                    title: 'Where you stand',
                    body: 'A clear snapshot from your answers — not generic career advice.',
                  },
                  {
                    title: 'Your real gaps',
                    body: '2–3 specific gaps vs your 12–24 month goal, plus focus areas.',
                  },
                  {
                    title: 'What to do next',
                    body: 'Three solo actions — then an optional live expert review of this report.',
                  },
                ].map((item) => (
                  <li
                    key={item.title}
                    className="rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface-soft)] px-4 py-3.5"
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
