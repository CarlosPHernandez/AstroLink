import Image from 'next/image';
import { LandingScrollReveal } from '@/components/landing/landing-scroll-reveal';

const ROWS = [
  {
    label: 'Speaker / honorarium',
    speaker: '$5,000–$25,000+',
    astrolink: 'Published per-session rate',
  },
  {
    label: 'Travel, hotel, AV',
    speaker: '$1,000–$5,000',
    astrolink: '$0',
  },
  {
    label: 'Lead time',
    speaker: 'Weeks to months',
    astrolink: 'Days',
  },
  {
    label: 'What students get',
    speaker: 'One afternoon, one person',
    astrolink: 'A semester of live access',
  },
] as const;

export function EducatorsCostComparison() {
  return (
    <section className="bg-[var(--landing-surface)] py-16 sm:py-20 lg:py-24">
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-10 sm:mb-12 lg:items-center">
          <div className="lg:col-span-5">
            <h2 className="font-landing-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--landing-text)] text-balance leading-[1.15]">
              One guest speaker. Or a whole semester of access.
            </h2>
            <p className="mt-4 text-base text-[var(--landing-muted)] leading-relaxed max-w-[40ch]">
              A single in-person speaker with travel can run $6,000–$30,000. That budget covers many
              live sessions with verified experts — no flights, no empty seat if a connection drops.
            </p>
          </div>
          <LandingScrollReveal
            as="div"
            variant="up"
            className="lg:col-span-7 overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface-soft)] shadow-[0_20px_48px_-32px_rgba(14,20,32,0.22)]"
          >
            <div className="relative aspect-[16/10] w-full">
              <Image
                src="/educators/educator-planning.jpg"
                alt="Educator planning career-day sessions at a laptop in a bright school office"
                fill
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover object-[center_30%]"
              />
            </div>
          </LandingScrollReveal>
        </div>

        <LandingScrollReveal
          as="div"
          variant="up"
          className="overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)] shadow-[0_20px_48px_-32px_rgba(14,20,32,0.2)]"
        >
          <div className="grid grid-cols-1 sm:grid-cols-[1.15fr_1fr_1fr] border-b border-[var(--landing-border)]">
            <div className="hidden sm:block px-6 py-5 bg-[var(--landing-canvas)]" />
            <div className="px-6 py-5 border-t sm:border-t-0 sm:border-l border-[var(--landing-border)] bg-[var(--landing-canvas)]">
              <p className="text-sm font-semibold text-[var(--landing-muted)]">Speaker route</p>
            </div>
            <div className="px-6 py-5 border-t sm:border-t-0 sm:border-l border-[var(--landing-border)] bg-[color-mix(in_srgb,var(--landing-accent)_7%,var(--landing-surface))]">
              <p className="text-sm font-semibold text-[var(--landing-accent)]">AstroLink</p>
            </div>
          </div>

          {ROWS.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-1 sm:grid-cols-[1.15fr_1fr_1fr] ${
                i < ROWS.length - 1 ? 'border-b border-[var(--landing-border)]' : ''
              }`}
            >
              <div className="px-6 py-4 sm:py-5">
                <p className="text-sm font-semibold text-[var(--landing-text)]">{row.label}</p>
              </div>
              <div className="px-6 py-3 sm:py-5 sm:border-l border-[var(--landing-border)] flex items-center">
                <p className="text-sm text-[var(--landing-muted)]">
                  <span className="sm:hidden text-xs font-semibold text-[var(--landing-faint)] mr-2">
                    Speaker
                  </span>
                  {row.speaker}
                </p>
              </div>
              <div className="px-6 py-3 sm:py-5 sm:border-l border-[var(--landing-border)] bg-[color-mix(in_srgb,var(--landing-accent)_4%,var(--landing-surface))] flex items-center">
                <p className="text-sm font-semibold text-[var(--landing-text)]">
                  <span className="sm:hidden text-xs font-semibold text-[var(--landing-accent)] mr-2">
                    AstroLink
                  </span>
                  {row.astrolink}
                </p>
              </div>
            </div>
          ))}
        </LandingScrollReveal>
      </div>
    </section>
  );
}
