import Link from 'next/link';
import { LandingScrollReveal } from '@/components/landing/landing-scroll-reveal';

const PROOFS = [
  {
    label: 'Verified operators',
    detail: 'Astronauts, flight controllers, and engineers who have done the work.',
  },
  {
    label: 'Live 1:1 video',
    detail: 'Private sessions with prep — not a generic AI chat.',
  },
  {
    label: 'Clear pricing',
    detail: 'See rates on expert profiles before you book.',
  },
] as const;

/**
 * Compact trust strip — only defendable product claims (no fabricated testimonials).
 */
export function LandingTrust() {
  return (
    <section
      id="trust"
      className="border-t border-[var(--landing-border)] py-10 sm:py-16 scroll-mt-20"
      data-testid="landing-trust"
      aria-label="Why AstroLink"
    >
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg">
        <LandingScrollReveal as="div" variant="up" className="max-w-[var(--max-width-prose)]">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--landing-faint)]">
            Built for real conversations
          </p>
          <h2 className="mt-1.5 sm:mt-2 font-landing-display text-[1.25rem] sm:text-2xl font-semibold text-[var(--landing-text)] tracking-tight leading-snug">
            Proof before you book.
          </h2>
        </LandingScrollReveal>

        <ul className="mt-6 sm:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8">
          {PROOFS.map((item, index) => (
            <LandingScrollReveal key={item.label} as="li" delay={index * 90} variant="up">
              <p className="text-sm font-semibold text-[var(--landing-text)]">{item.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--landing-muted)]">
                {item.detail}
              </p>
            </LandingScrollReveal>
          ))}
        </ul>

        <LandingScrollReveal delay={120} variant="up" className="mt-7 sm:mt-10">
          <p className="text-sm text-[var(--landing-muted)] leading-relaxed max-w-[var(--max-width-prose)]">
            Start with a featured session — talk with Inspiration4 astronaut{' '}
            <Link
              href="/talk-with-chris"
              className="inline-block py-1 font-medium text-[var(--landing-text)] underline-offset-2 hover:underline touch-manipulation"
              data-testid="landing-trust-chris-link"
            >
              Chris Sembroski
            </Link>
            .
          </p>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
