import { LandingScrollReveal } from '@/components/landing/landing-scroll-reveal';

const STEPS = [
  {
    number: '1',
    title: 'Tell us about your program',
    body: 'School or org, grade level, and the career paths your students are curious about.',
  },
  {
    number: '2',
    title: 'We match verified experts',
    body: 'From our roster of vetted aerospace professionals — matched to what students actually ask about.',
  },
  {
    number: '3',
    title: 'Students book live sessions',
    body: 'One-on-one or small group, on video — during a class period, career day, or club meeting.',
  },
] as const;

/** Clean steps only — photos stay concentrated in hero + bento for impact. */
export function EducatorsHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-t border-[var(--landing-border)] bg-[var(--landing-surface)] py-12 sm:py-16 lg:py-20 scroll-mt-20"
    >
      <div className="max-w-[1100px] mx-auto px-md sm:px-lg">
        <div className="mb-8 sm:mb-10 max-w-[32rem]">
          <h2 className="font-landing-display text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--landing-text)]">
            From first email to a booked session, in days.
          </h2>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {STEPS.map((step, i) => (
            <LandingScrollReveal key={step.number} as="li" delay={i * 60} variant="up">
              <p className="font-landing-display text-4xl font-extrabold tabular-nums tracking-tight text-[color-mix(in_srgb,var(--landing-accent)_25%,var(--landing-border))] mb-3">
                {step.number}
              </p>
              <p className="font-landing-display text-lg font-bold text-[var(--landing-text)] mb-2">
                {step.title}
              </p>
              <p className="text-sm leading-relaxed text-[var(--landing-muted)] max-w-[32ch]">
                {step.body}
              </p>
            </LandingScrollReveal>
          ))}
        </ol>

        <div className="mt-10">
          <a
            href="#demo"
            className="inline-flex min-h-12 touch-manipulation items-center justify-center rounded-full bg-[var(--landing-ink)] px-6 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)] focus-visible:ring-offset-2"
          >
            Book a demo
          </a>
        </div>
      </div>
    </section>
  );
}
