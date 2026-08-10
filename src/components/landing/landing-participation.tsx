import Image from 'next/image';
import { LandingScrollReveal } from '@/components/landing/landing-scroll-reveal';

const GEMINI_XPRIZE_HREF = 'https://www.geminixprize.com/';
const DEVPOST_HREF = 'https://xprize.devpost.com/';

const STATUS_PILLS = ['Professional Services Access', '$2M prize pool', 'Deadline Aug 17, 2026'] as const;

const APX_TILES = [
  { id: 'APX-01', label: 'Booking', body: 'Expert matching from buyer goals and roster' },
  { id: 'APX-02', label: 'Briefing', body: 'Dual pre-session briefs for mentee and expert' },
  { id: 'APX-03', label: 'Session', body: 'Post-call summary and action items from the transcript' },
  { id: 'APX-06', label: 'Translation', body: 'Live captions and localized recap' },
  { id: 'APX-08', label: 'Notifications', body: 'Booking confirmation and calendar invite' },
  { id: 'APX-04', label: 'Compliance', body: 'Intake and transcript flags for ops review' },
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
          <div className="flex flex-wrap gap-2.5 border-b border-[var(--landing-border)] px-6 sm:px-7 py-5">
            {STATUS_PILLS.map((pill, i) => (
              <span
                key={pill}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  i === 0
                    ? 'bg-[var(--landing-accent-tint)] text-[var(--landing-accent)]'
                    : 'bg-[var(--landing-surface-soft)] text-[var(--landing-text)]'
                }`}
              >
                {pill}
              </span>
            ))}
          </div>

          <div className="px-6 sm:px-7 py-7 sm:py-8 text-left">
            <h2 className="font-landing-display text-lg sm:text-xl font-bold tracking-tight text-[var(--landing-text)] mb-3">
              An expert network with Gemini doing the operational work
            </h2>
            <p className="text-sm leading-relaxed text-[var(--landing-muted)] mb-6">
              High-stakes aerospace knowledge is locked behind personal networks and consulting
              firms most people can&apos;t access. AstroLink is a marketplace where anyone can
              discover, book, and learn from a verified expert — with Gemini running match,
              briefing, session synthesis, translation, and compliance triage in production, not
              as a demo.
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
