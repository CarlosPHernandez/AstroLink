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
    <section className="bg-[var(--landing-surface)] py-12 sm:py-16 lg:py-20">
      <div className="max-w-[1100px] mx-auto px-md sm:px-lg">
        <div className="mb-8 sm:mb-10 max-w-[36rem]">
          <h2 className="font-landing-display text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--landing-text)] text-balance">
            One guest speaker. Or a whole semester of access.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[var(--landing-muted)] leading-relaxed">
            A single in-person speaker with travel can run $6,000–$30,000. That budget covers many
            live sessions with verified experts — no flights, no empty seat if a connection drops.
          </p>
        </div>

        <LandingScrollReveal
          as="div"
          variant="up"
          className="overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)]"
        >
          <div className="grid grid-cols-1 sm:grid-cols-[1.15fr_1fr_1fr] border-b border-[var(--landing-border)]">
            <div className="hidden sm:block px-6 py-4 bg-[var(--landing-canvas)]" />
            <div className="px-6 py-4 border-t sm:border-t-0 sm:border-l border-[var(--landing-border)] bg-[var(--landing-canvas)]">
              <p className="text-sm font-semibold text-[var(--landing-muted)]">Speaker route</p>
            </div>
            <div className="px-6 py-4 border-t sm:border-t-0 sm:border-l border-[var(--landing-border)] bg-[color-mix(in_srgb,var(--landing-accent)_7%,var(--landing-surface))]">
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
              <div className="px-6 py-4">
                <p className="text-sm font-semibold text-[var(--landing-text)]">{row.label}</p>
              </div>
              <div className="px-6 py-3 sm:py-4 sm:border-l border-[var(--landing-border)] flex items-center">
                <p className="text-sm text-[var(--landing-muted)]">
                  <span className="sm:hidden text-xs font-semibold text-[var(--landing-faint)] mr-2">
                    Speaker
                  </span>
                  {row.speaker}
                </p>
              </div>
              <div className="px-6 py-3 sm:py-4 sm:border-l border-[var(--landing-border)] bg-[color-mix(in_srgb,var(--landing-accent)_4%,var(--landing-surface))] flex items-center">
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
