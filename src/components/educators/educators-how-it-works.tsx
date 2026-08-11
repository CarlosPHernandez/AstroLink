import Image from 'next/image';
import { LandingScrollReveal } from '@/components/landing/landing-scroll-reveal';

const STEPS = [
  {
    number: '1',
    title: 'Tell us about your program',
    body: 'School or org, grade level, and the career paths your students are curious about.',
    imageSrc: '/educators/educator-planning.jpg',
    imageAlt: 'Educator planning sessions on a laptop',
  },
  {
    number: '2',
    title: 'We match verified experts',
    body: 'From our roster of vetted aerospace professionals — matched to what students actually ask about.',
    imageSrc: '/educators/speaker-access-v2.jpg',
    imageAlt: 'Student connecting live with a verified expert',
  },
  {
    number: '3',
    title: 'Students book live sessions',
    body: 'One-on-one or small group, on video — during a class period, career day, or club meeting.',
    imageSrc: '/educators/hero-live-session.jpg',
    imageAlt: 'Classroom live session with students and mentor on video',
  },
] as const;

export function EducatorsHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-[var(--landing-canvas)] py-16 sm:py-20 lg:py-24 scroll-mt-20"
    >
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg">
        <div className="max-w-[32rem] mb-10 sm:mb-14">
          <h2 className="font-landing-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--landing-text)] leading-[1.15]">
            From first email to a booked session, in days.
          </h2>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {STEPS.map((step, i) => (
            <LandingScrollReveal
              key={step.number}
              as="li"
              delay={i * 60}
              variant="up"
              className="group overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-[var(--landing-surface-soft)]">
                <Image
                  src={step.imageSrc}
                  alt={step.imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              </div>
              <div className="p-5 sm:p-6">
                <p className="font-landing-display text-3xl font-extrabold tabular-nums tracking-tight text-[color-mix(in_srgb,var(--landing-accent)_28%,var(--landing-border))] mb-3">
                  {step.number}
                </p>
                <p className="font-landing-display text-lg font-bold text-[var(--landing-text)] mb-2">
                  {step.title}
                </p>
                <p className="text-sm sm:text-[15px] leading-relaxed text-[var(--landing-muted)]">
                  {step.body}
                </p>
              </div>
            </LandingScrollReveal>
          ))}
        </ol>

        <div className="mt-12 flex flex-wrap items-center gap-4">
          <a
            href="#demo"
            className="inline-flex min-h-12 touch-manipulation items-center justify-center rounded-full bg-[var(--landing-ink)] px-6 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)] focus-visible:ring-offset-2"
          >
            Book a demo
          </a>
          <p className="text-sm text-[var(--landing-muted)]">
            No obligation — we&apos;ll walk you through the roster.
          </p>
        </div>
      </div>
    </section>
  );
}
