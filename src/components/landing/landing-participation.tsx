import Image from 'next/image';
import { LandingScrollReveal } from '@/components/landing/landing-scroll-reveal';

const GEMINI_XPRIZE_HREF = 'https://www.geminixprize.com/';
const DEVPOST_HREF = 'https://xprize.devpost.com/';

/**
 * Slim participation strip — Build with Gemini XPRIZE.
 * Real brand marks from /public/logos-google.
 * Honest “proudly participating” claim only (no implied win/endorsement).
 */
export function LandingParticipation() {
  return (
    <section
      id="participation"
      className="border-t border-[var(--landing-border)] bg-white py-12 sm:py-16"
      data-testid="landing-participation"
      aria-label="Competition participation"
    >
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg">
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
            className="group inline-flex flex-wrap items-center justify-center gap-x-8 gap-y-6 sm:gap-x-12 rounded-sm px-2 py-1 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            data-testid="landing-participation-link"
          >
            <Image
              src="/logos-google/gemini.jpeg"
              alt="Gemini"
              width={640}
              height={180}
              className="h-16 w-auto max-w-[min(100%,280px)] sm:h-24 sm:max-w-[360px] md:h-28 md:max-w-[420px] object-contain object-center"
              sizes="(max-width: 640px) 280px, (max-width: 768px) 360px, 420px"
              priority={false}
            />

            <span
              className="h-12 w-px shrink-0 bg-[var(--landing-border)] sm:h-16 md:h-20"
              aria-hidden
            />

            <Image
              src="/logos-google/xprize.jpeg"
              alt="XPRIZE"
              width={720}
              height={180}
              className="h-16 w-auto max-w-[min(100%,300px)] sm:h-24 sm:max-w-[400px] md:h-28 md:max-w-[460px] object-contain object-center"
              sizes="(max-width: 640px) 300px, (max-width: 768px) 400px, 460px"
              priority={false}
            />
          </a>

          <p className="text-xs sm:text-sm text-[var(--landing-muted)]">
            <a
              href={DEVPOST_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 hover:text-[var(--landing-text)] hover:underline"
              data-testid="landing-participation-devpost"
            >
              Learn more
            </a>
          </p>
        </LandingScrollReveal>
      </div>
    </section>
  );
}
