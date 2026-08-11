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
        <div className="lg:grid lg:grid-cols-12 lg:gap-12 lg:items-start">
          <div className="max-w-[720px] lg:col-span-7 lg:max-w-none">
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

            <p className="mt-6 text-sm text-[var(--landing-muted)]">
              <Link
                href="/experts"
                className="font-semibold text-[var(--landing-accent)] hover:text-[var(--landing-accent-hover)] underline-offset-2 hover:underline"
              >
                Browse experts your class can book
              </Link>
            </p>
          </div>

          <dl className="mt-10 lg:mt-1 lg:col-span-5 flex flex-wrap gap-x-10 gap-y-5 lg:flex-col lg:gap-5 lg:border-l lg:border-[var(--landing-border)] lg:pl-10">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <p className="font-landing-display text-2xl lg:text-[1.75rem] font-extrabold tracking-tight text-[var(--landing-text)]">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--landing-muted)] leading-snug">
                    {stat.label}
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-10 sm:mt-12 lg:mt-14">
          <div className="overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface-soft)] shadow-[0_32px_64px_-36px_rgba(14,20,32,0.35)]">
            <EducatorsHeroMedia
              src="/educators/hero-live-session.jpg"
              alt="Students and an instructor in a bright classroom on a live video call with a professional mentor"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
