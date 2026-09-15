import Link from 'next/link';
import { LandingScrollReveal } from '@/components/landing/landing-scroll-reveal';

const CARDS = [
  {
    number: '01',
    title: 'Verified operators',
    body: 'Astronauts, flight controllers, and engineers who have done the work — not influencers, not recruiters.',
  },
  {
    number: '02',
    title: 'You pick the person',
    body: 'Open a profile, watch the intro, see the rate. Book a live session only when you are ready.',
  },
  {
    number: '03',
    title: 'Rate on the profile',
    body: 'Published prices. No hidden fees, no bundles, no “contact us for pricing.”',
  },
] as const;

export function LandingIntroGrid() {
  return (
    <section className="border-t border-[var(--landing-border)] py-10 sm:py-16 lg:py-20">
      <div className="max-w-[1100px] mx-auto px-md sm:px-lg">
        <div className="max-w-[820px] mx-auto text-center mb-8 sm:mb-10">
          <h2 className="font-landing-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--landing-text)] mb-3">
            Not a coach. Someone who has done the job.
          </h2>
          <p className="text-sm sm:text-base leading-relaxed text-[var(--landing-muted)]">
            High-stakes aerospace knowledge is locked behind personal networks and consulting firms
            most people cannot access. AstroLink is where you discover a verified operator, see the
            rate, and book a live 1:1 — a real conversation with someone who has done the work.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 mb-9">
          {CARDS.map((card, i) => (
            <LandingScrollReveal
              key={card.number}
              as="div"
              delay={i * 90}
              variant="up"
              className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)] p-6 sm:p-7 transition-[box-shadow,border-color] duration-200 hover:shadow-[0_12px_32px_-18px_rgba(14,20,32,0.18)] hover:border-[var(--landing-muted)]"
            >
              <p className="text-xs font-bold tracking-[0.06em] text-[var(--landing-accent)] mb-2.5">
                {card.number}
              </p>
              <p className="font-landing-display text-lg font-bold text-[var(--landing-text)] mb-2">
                {card.title}
              </p>
              <p className="text-sm leading-relaxed text-[var(--landing-muted)]">{card.body}</p>
            </LandingScrollReveal>
          ))}
        </div>

        <p className="text-center">
          <Link href="/experts" className="text-sm font-semibold text-[var(--landing-accent)] hover:underline">
            Browse the full expert directory →
          </Link>
        </p>
      </div>
    </section>
  );
}
