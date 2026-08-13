import Image from 'next/image';
import { LandingScrollReveal } from '@/components/landing/landing-scroll-reveal';

/**
 * High-impact bento: one oversized photo + stacked stories + full-width orbital.
 * Matches the earlier layout that had the strongest visual hit.
 */
const FEATURED = {
  title: 'Live mentorship that sticks',
  body: 'A class period with someone who has flown the mission, built the system, or hired for the role — not another slide deck they forget by Friday.',
  imageSrc: '/educators/student-success.jpg',
  imageAlt:
    'College students smiling during a live video session with an aerospace professional',
} as const;

const SIDE = [
  {
    id: 'esl',
    title: 'Every student can follow',
    body: 'Bilingual captions and live video mean language is a bridge — not a gate — into aerospace careers.',
    imageSrc: '/educators/esl-access-v2.jpg',
    imageAlt: 'Students with bilingual live captions during a mentorship session',
  },
  {
    id: 'access',
    title: 'Experts without the speaker fee',
    body: 'No flights, hotels, or AV contracts. Book verified professionals into a class period or career-day block.',
    imageSrc: '/educators/speaker-access-v2.jpg',
    imageAlt: 'Student on a video call with a verified expert in a campus lounge',
  },
] as const;

const WIDE = {
  title: 'From classroom to mission pathways',
  body: 'Operators, engineers, and mission specialists who make space real — careers your students can actually ask about.',
  imageSrc: '/educators/orbital-missions-v2.jpg',
  imageAlt: 'Students looking at Earth from low orbit on a large classroom display',
} as const;

export function EducatorsValueBento() {
  return (
    <section
      id="why-astrolink"
      className="bg-[var(--landing-canvas)] py-12 sm:py-16 lg:py-20 scroll-mt-20"
    >
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg">
        <div className="mb-8 sm:mb-10 max-w-[36rem]">
          <h2 className="font-landing-display text-xl sm:text-2xl lg:text-[1.85rem] font-extrabold tracking-tight text-[var(--landing-text)] text-balance">
            Built for the gap between your students and the people who&apos;ve done the work.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[var(--landing-muted)] leading-relaxed">
            Student success, language access, real speaker access, and pathways into orbital
            missions — without logistics theater.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* Oversized featured tile */}
          <LandingScrollReveal
            as="article"
            variant="up"
            className="group lg:col-span-7 relative overflow-hidden rounded-2xl border border-[var(--landing-border)] min-h-[340px] sm:min-h-[420px] lg:min-h-[520px]"
          >
            <Image
              src={FEATURED.imageSrc}
              alt={FEATURED.imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 700px"
              className="object-cover object-[78%_center] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-[rgba(14,20,32,0.9)] via-[rgba(14,20,32,0.4)] to-transparent"
              aria-hidden
            />
            <div className="relative z-10 flex h-full min-h-[340px] sm:min-h-[420px] lg:min-h-[520px] flex-col justify-end p-6 sm:p-8">
              <h3 className="font-landing-display text-2xl sm:text-3xl font-bold text-white tracking-tight max-w-[20ch]">
                {FEATURED.title}
              </h3>
              <p className="mt-3 text-sm sm:text-[15px] leading-relaxed text-white/90 max-w-[42ch]">
                {FEATURED.body}
              </p>
            </div>
          </LandingScrollReveal>

          {/* Side stack — tall photo bands */}
          <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-5">
            {SIDE.map((tile, i) => (
              <LandingScrollReveal
                key={tile.id}
                as="article"
                delay={(i + 1) * 50}
                variant="up"
                className="group relative flex-1 overflow-hidden rounded-2xl border border-[var(--landing-border)] min-h-[220px] sm:min-h-[248px]"
              >
                <Image
                  src={tile.imageSrc}
                  alt={tile.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 400px"
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-[rgba(14,20,32,0.9)] via-[rgba(14,20,32,0.45)] to-transparent"
                  aria-hidden
                />
                <div className="relative z-10 flex h-full min-h-[220px] sm:min-h-[248px] flex-col justify-end p-5 sm:p-6">
                  <h3 className="font-landing-display text-lg sm:text-xl font-bold text-white tracking-tight">
                    {tile.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/88 max-w-[34ch]">
                    {tile.body}
                  </p>
                </div>
              </LandingScrollReveal>
            ))}
          </div>

          {/* Full-width orbital band */}
          <LandingScrollReveal
            as="article"
            delay={120}
            variant="up"
            className="group lg:col-span-12 relative overflow-hidden rounded-2xl border border-[var(--landing-border)] min-h-[240px] sm:min-h-[280px]"
          >
            <Image
              src={WIDE.imageSrc}
              alt={WIDE.imageAlt}
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover object-[center_32%] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-[rgba(14,20,32,0.9)] via-[rgba(14,20,32,0.55)] to-[rgba(14,20,32,0.15)]"
              aria-hidden
            />
            <div className="relative z-10 flex h-full min-h-[240px] sm:min-h-[280px] flex-col justify-end sm:justify-center p-6 sm:p-8 max-w-[40ch]">
              <h3 className="font-landing-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                {WIDE.title}
              </h3>
              <p className="mt-2 text-sm sm:text-[15px] leading-relaxed text-white/90">
                {WIDE.body}
              </p>
            </div>
          </LandingScrollReveal>
        </div>

        <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--landing-muted)]">
          {[
            'Clear published rates',
            'Book around class periods',
            'Verified credentials on every expert',
          ].map((item) => (
            <li key={item} className="inline-flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-[var(--landing-accent)]" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
