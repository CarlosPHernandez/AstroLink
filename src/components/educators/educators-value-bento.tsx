import Image from 'next/image';
import { LandingScrollReveal } from '@/components/landing/landing-scroll-reveal';

/**
 * Stripe-inspired product bento with high-quality Imagine stills.
 */
const TILES = [
  {
    id: 'success',
    span: 'sm:col-span-2 sm:row-span-2',
    title: 'Live mentorship that sticks',
    body: 'A class period with someone who has done the work — not another slide deck they forget by Friday.',
    imageSrc: '/educators/student-success.jpg',
    imageAlt:
      'College students and instructor in a bright classroom during a live video session with an aerospace professional',
    featured: true,
    objectPos: 'object-[78%_center]',
  },
  {
    id: 'esl',
    span: 'sm:col-span-1',
    title: 'Every student can follow',
    body: 'Language access built in — bilingual captions so ESL students stay in the conversation.',
    imageSrc: '/educators/esl-access-v2.jpg',
    imageAlt:
      'Diverse students watching a mentor on a laptop with live caption overlays in a classroom',
    objectPos: 'object-center',
  },
  {
    id: 'access',
    span: 'sm:col-span-1',
    title: 'Experts without the speaker fee',
    body: 'No flights, hotels, or AV. Book into a class period or career-day block.',
    imageSrc: '/educators/speaker-access-v2.jpg',
    imageAlt:
      'Student on a laptop video call with a verified professional expert in a campus lounge',
    objectPos: 'object-center',
  },
  {
    id: 'orbital',
    span: 'sm:col-span-2',
    title: 'From classroom to mission pathways',
    body: 'Operators, engineers, and mission specialists — careers students can actually ask about.',
    imageSrc: '/educators/orbital-missions-v2.jpg',
    imageAlt:
      'Students in a modern classroom looking at a large display of Earth from low Earth orbit',
    objectPos: 'object-[center_35%]',
  },
] as const;

export function EducatorsValueBento() {
  return (
    <section
      id="why-astrolink"
      className="bg-[var(--landing-canvas)] py-16 sm:py-20 lg:py-24 scroll-mt-20"
    >
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg">
        <div className="max-w-[36rem] mb-10 sm:mb-12">
          <h2 className="font-landing-display text-2xl sm:text-3xl lg:text-[2.15rem] font-extrabold tracking-tight text-[var(--landing-text)] text-balance leading-[1.15]">
            Flexible access for every classroom.
          </h2>
          <p className="mt-4 text-base text-[var(--landing-muted)] leading-relaxed">
            Student success, language access, real speaker access, and pathways into orbital
            missions — designed to work for a single class or a whole program.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 auto-rows-fr">
          {TILES.map((tile, i) => (
            <LandingScrollReveal
              key={tile.id}
              as="article"
              delay={i * 45}
              variant="up"
              className={`group relative overflow-hidden rounded-2xl bg-[var(--landing-surface)] border border-[var(--landing-border)] min-h-[220px] sm:min-h-0 ${
                tile.featured ? 'sm:min-h-[420px]' : 'sm:min-h-[200px]'
              } ${tile.span}`}
            >
              <div className="absolute inset-0">
                <Image
                  src={tile.imageSrc}
                  alt={tile.imageAlt}
                  fill
                  sizes={
                    tile.featured
                      ? '(max-width: 640px) 100vw, 600px'
                      : '(max-width: 640px) 100vw, 400px'
                  }
                  className={`object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] ${tile.objectPos}`}
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-[rgba(14,20,32,0.88)] via-[rgba(14,20,32,0.35)] to-transparent"
                  aria-hidden
                />
              </div>

              <div
                className={`relative z-10 flex h-full flex-col justify-end p-5 sm:p-6 ${
                  tile.featured ? 'sm:p-8' : ''
                }`}
              >
                <h3
                  className={`font-landing-display font-bold text-white tracking-tight ${
                    tile.featured ? 'text-xl sm:text-2xl lg:text-3xl' : 'text-lg sm:text-xl'
                  }`}
                >
                  {tile.title}
                </h3>
                <p
                  className={`mt-2 text-sm leading-relaxed text-white/85 ${
                    tile.featured ? 'max-w-[36ch] sm:text-[15px]' : 'max-w-[32ch]'
                  }`}
                >
                  {tile.body}
                </p>
              </div>
            </LandingScrollReveal>
          ))}
        </div>

        <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-sm text-[var(--landing-muted)]">
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
