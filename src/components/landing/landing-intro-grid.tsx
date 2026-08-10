import Link from 'next/link';
import { LandingScrollReveal } from '@/components/landing/landing-scroll-reveal';

const CARDS = [
  {
    number: '01',
    title: 'Verified operators',
    body: "Astronauts, flight controllers, and engineers who've done the work — not influencers, not recruiters.",
  },
  {
    number: '02',
    title: 'Real career paths',
    body: 'Ask about the path that matters to you and hear what actually worked, from someone who walked it.',
  },
  {
    number: '03',
    title: 'Browse before you book',
    body: 'See rates and watch an intro on every profile. Book a live session only when you’re ready.',
  },
] as const;

export function LandingIntroGrid() {
  return (
    <section className="border-t border-[var(--landing-border)] py-10 sm:py-16 lg:py-20">
      <div className="max-w-[1100px] mx-auto px-md sm:px-lg">
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

        <p className="text-center text-base text-[var(--landing-muted)] max-w-[62ch] mx-auto mb-4">
          AstroLink is for students, career-switchers, and teams who want a real conversation
          instead of another forum thread.
        </p>
        <p className="text-center">
          <Link href="/experts" className="text-sm font-semibold text-[var(--landing-accent)] hover:underline">
            Browse the full expert directory →
          </Link>
        </p>
      </div>
    </section>
  );
}
