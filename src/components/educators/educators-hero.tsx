import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';
import { EducatorsHeroMedia } from '@/components/educators/educators-hero-media';

const STATS = [
  { value: '$0', label: 'travel or AV budget' },
  { value: 'Days', label: 'to book a session' },
  { value: 'Live', label: '1:1 or small group' },
] as const;

export function EducatorsHero() {
  return (
    <section
      className="bg-[var(--landing-surface)] pt-12 sm:pt-16 lg:pt-20 pb-12 sm:pb-16 lg:pb-20"
      data-testid="educators-hero"
      aria-labelledby="educators-hero-title"
    >
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg">
        <div className="max-w-[720px]">
          <p className="text-sm font-semibold text-[var(--landing-accent)] mb-4">
            AstroLink for educators
          </p>
          <h1
            id="educators-hero-title"
            className="font-landing-display text-[2.1rem] leading-[1.08] sm:text-[2.75rem] lg:text-[3.25rem] font-extrabold tracking-tight text-[var(--landing-text)] text-balance"
          >
            Real access for your students, without the speaker fee.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-[var(--landing-muted)] leading-relaxed max-w-[48ch]">
            Give your class live time with verified aerospace professionals — on video, on your
            calendar, without flying anyone in.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
            <a
              href="#demo"
              className="inline-flex min-h-12 touch-manipulation items-center justify-center gap-1.5 rounded-full bg-[var(--landing-ink)] px-6 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)] focus-visible:ring-offset-2"
              data-testid="educators-hero-demo-cta"
            >
              Book a demo
              <MaterialIcon name="arrow_forward" size={16} className="text-white shrink-0" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex min-h-12 touch-manipulation items-center justify-center px-2 text-sm font-semibold text-[var(--landing-text)] hover:text-[var(--landing-accent)]"
            >
              See how it works
            </a>
          </div>
        </div>

        <div className="mt-10 sm:mt-12 lg:mt-14 relative">
          <div className="overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface-soft)] shadow-[0_32px_64px_-36px_rgba(14,20,32,0.35)]">
            <EducatorsHeroMedia
              src="/educators/hero-live-session.jpg"
              alt="Students and an instructor in a bright classroom on a live video call with a professional mentor"
            />
          </div>

          <div className="mt-6 sm:mt-0 sm:absolute sm:left-6 sm:right-6 sm:-bottom-7 lg:left-10 lg:right-10">
            <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-[var(--landing-border)] bg-[var(--landing-border)] shadow-[0_16px_40px_-24px_rgba(14,20,32,0.25)]">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-[var(--landing-surface)] px-3 py-4 sm:px-5 sm:py-5 text-center sm:text-left"
                >
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <p className="font-landing-display text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-[var(--landing-text)]">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-xs sm:text-sm text-[var(--landing-muted)] leading-snug">
                      {stat.label}
                    </p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="hidden sm:block h-10 lg:h-12" aria-hidden />

        <p className="mt-6 sm:mt-2 text-sm text-[var(--landing-muted)]">
          <Link
            href="/experts"
            className="font-semibold text-[var(--landing-accent)] hover:text-[var(--landing-accent-hover)] underline-offset-2 hover:underline"
          >
            Browse experts your class can book
          </Link>
        </p>
      </div>
    </section>
  );
}
