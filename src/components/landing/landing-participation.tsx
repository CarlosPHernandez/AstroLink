import Image from 'next/image';
import { LandingScrollReveal } from '@/components/landing/landing-scroll-reveal';

const GEMINI_XPRIZE_HREF = 'https://www.geminixprize.com/';
const DEVPOST_HREF = 'https://xprize.devpost.com/';

const APX_TILES = [
  { id: 'APX-10', label: 'Path Assessment', body: 'Free readiness report; Gemini picks a listed expert when the model succeeds' },
  { id: 'APX-02', label: 'Briefing', body: 'Dual pre-session briefs for mentee and expert after payment' },
  { id: 'APX-12', label: 'Settlement', body: 'After hang-up, Gemini decides completed / no-show / hold and payout eligibility' },
  { id: 'APX-03', label: 'Session recap', body: 'Summary and action items only when a stored transcript exists' },
  { id: 'APX-06', label: 'Translation', body: 'Live captions and localized recap when the buyer is not in English' },
  { id: 'APX-09', label: 'Reviews', body: 'Screens consented quotes; auto-publishes only when policy-clear' },
] as const;

/**
 * Build with Gemini XPRIZE participation section.
 * Real brand marks from /public/logos-google.
 * Honest “proudly participating” claim only (no implied win/endorsement).
 */
export function LandingParticipation() {
  return (
    <section
      id="participation"
      className="border-t border-[var(--landing-border)] bg-white py-8 sm:py-10"
      data-testid="landing-participation"
      aria-label="Competition participation"
    >
      <div className="max-w-[1100px] mx-auto px-md sm:px-lg">
        <LandingScrollReveal
          as="div"
          variant="up"
          className="flex flex-col items-center justify-center gap-5 sm:gap-6 text-center"
        >
          <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--landing-faint)]">
            Proudly participating in
          </p>

          <a
            href={GEMINI_XPRIZE_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-4 sm:gap-x-10 rounded-sm px-2 py-1 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            data-testid="landing-participation-link"
          >
            <Image
              src="/logos-google/gemini.jpeg"
              alt="Gemini"
              width={640}
              height={180}
              className="h-10 w-auto max-w-[min(100%,160px)] sm:h-14 sm:max-w-[220px] object-contain object-center"
              sizes="(max-width: 640px) 160px, 220px"
              priority={false}
            />

            <span
              className="h-8 w-px shrink-0 bg-[var(--landing-border)] sm:h-10"
              aria-hidden
            />

            <Image
              src="/logos-google/xprize.jpeg"
              alt="XPRIZE"
              width={720}
              height={180}
              className="h-10 w-auto max-w-[min(100%,170px)] sm:h-14 sm:max-w-[240px] object-contain object-center"
              sizes="(max-width: 640px) 170px, 240px"
              priority={false}
            />
          </a>
        </LandingScrollReveal>

        <LandingScrollReveal
          as="div"
          variant="up"
          delay={90}
          className="mt-8 sm:mt-10 mx-auto max-w-[820px] overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)] shadow-[0_20px_48px_-30px_rgba(14,20,32,0.16)]"
        >
          <div className="px-6 sm:px-7 py-7 sm:py-8 text-left">
            <h2 className="font-landing-display text-lg sm:text-xl font-bold tracking-tight text-[var(--landing-text)] mb-3">
              An expert network where Gemini allocates demand and settles sessions
            </h2>
            <p className="text-sm leading-relaxed text-[var(--landing-muted)] mb-6">
              High-stakes aerospace knowledge is locked behind personal networks and consulting
              firms most people can&apos;t access. AstroLink is a marketplace where anyone can
              discover, book, and learn from a verified expert. Gemini writes the free Path
              Assessment, matches that inbound to a listed expert, writes both pre-session
              briefs, and settles whether the session counts for payout.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px overflow-hidden rounded-xl bg-[var(--landing-border)]">
              {APX_TILES.map((tile) => (
                <div key={tile.id} className="bg-[var(--landing-surface)] px-4 py-3.5">
                  <p className="text-xs font-bold text-[var(--landing-text)]">
                    {tile.id} · {tile.label}
                  </p>
                  <p className="mt-1 text-[12.5px] text-[var(--landing-muted)]">{tile.body}</p>
                </div>
              ))}
            </div>

            <a
              href={DEVPOST_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block text-sm font-semibold text-[var(--landing-accent)] underline-offset-2 hover:underline"
              data-testid="landing-participation-devpost"
            >
              Read the submission on Devpost →
            </a>
          </div>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
