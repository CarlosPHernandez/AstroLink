'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { MaterialIcon } from '@/components/ui/material-icon';
import { HOMEPAGE_TOPIC_CHIPS } from '@/lib/experts/public-expert-copy';
import {
  trackSpaHeroLinkClick,
  trackSpaOfferClick,
} from '@/lib/path-assessment/path-assessment-analytics';

const ASSESSMENT_HREF = '/assessment';
const EXPERTS_HREF = '/experts';

/**
 * Variation B search hero — booking is the product, assessment is the backup door.
 */
export default function LandingHero({ rateFloorLabel }: { rateFloorLabel: string }) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const onSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/experts?q=${encodeURIComponent(trimmed)}` : EXPERTS_HREF);
  };

  return (
    <section
      className="landing-hero-section border-b border-[var(--landing-border)] pt-6 sm:pt-14 lg:pt-16 pb-7 sm:pb-12 lg:pb-14"
      data-testid="landing-hero"
      aria-labelledby="landing-hero-title"
    >
      <div className="max-w-[800px] mx-auto px-md sm:px-lg text-center">
        <p
          className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--landing-accent)]"
          data-testid="landing-hero-eyebrow"
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]"
            aria-hidden
          />
          Verified expert network · Live 1:1 · Aerospace
        </p>

        <h1
          id="landing-hero-title"
          data-testid="landing-hero-title"
          className="mt-3 font-landing-display text-[1.75rem] leading-[1.15] sm:text-[2.35rem] lg:text-[2.75rem] font-extrabold tracking-tight text-[var(--landing-text)] sm:text-balance"
        >
          1-on-1 with people who{' '}
          <br className="sm:hidden" />
          have done the work.
        </h1>

        <p className="mt-3 sm:hidden text-[15px] text-[var(--landing-muted)] leading-relaxed max-w-[36ch] mx-auto text-pretty">
          Live 1:1 with a verified operator. See the rate, watch an intro, book when you’re ready.
        </p>
        <p className="mt-3 sm:mt-4 hidden sm:block text-sm sm:text-base text-[var(--landing-muted)] leading-relaxed max-w-prose mx-auto text-pretty">
          Live video with a verified astronaut, flight controller, or engineer. See the rate, watch
          an intro, book when you are ready. A real conversation — not a search result.
        </p>

        <p className="mt-3 text-sm text-[var(--landing-text)] max-w-[46ch] mx-auto text-pretty">
          For students, career-switchers, and teams who want a real conversation instead of another
          forum thread.
        </p>

        <p
          className="mt-4 text-[12px] sm:text-[13px] font-medium text-[var(--landing-text)]"
          data-testid="landing-hero-proof"
        >
          <span className="sm:hidden">From {rateFloorLabel} · Verified · Intro on every profile</span>
          <span className="hidden sm:inline">
            Verified · Published rates from {rateFloorLabel} · Intro video on every profile
          </span>
        </p>

        <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-6">
          <Link
            href={EXPERTS_HREF}
            className="inline-flex min-h-12 w-full sm:w-auto touch-manipulation items-center justify-center gap-1.5 rounded-full bg-[var(--landing-ink)] px-6 text-base sm:text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)] focus-visible:ring-offset-2"
            data-testid="landing-hero-experts-cta"
          >
            Browse experts
            <MaterialIcon name="arrow_forward" size={16} className="text-white shrink-0" />
          </Link>
          <Link
            href={ASSESSMENT_HREF}
            onClick={() => {
              trackSpaOfferClick();
              trackSpaHeroLinkClick();
            }}
            className="inline-flex min-h-11 w-full sm:w-auto touch-manipulation items-center justify-center text-sm font-semibold text-[var(--landing-text)] hover:text-[var(--landing-accent)]"
            data-testid="landing-hero-assessment-cta"
          >
            Start free assessment
          </Link>
        </div>

        <form
          onSubmit={onSearchSubmit}
          className="mt-6 hidden sm:flex items-center gap-2 max-w-[560px] mx-auto rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)] py-2 pl-5 pr-2 shadow-[0_12px_36px_-22px_rgba(14,20,32,0.2)]"
          data-testid="landing-hero-search"
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by mission, role, or name"
            aria-label="Search experts"
            className="flex-1 border-none outline-none bg-transparent text-sm text-[var(--landing-text)] placeholder:text-[var(--landing-faint)]"
          />
          <button
            type="submit"
            aria-label="Search"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--landing-ink)] text-white hover:opacity-90"
          >
            <MaterialIcon name="arrow_forward" size={16} className="text-white" />
          </button>
        </form>

        <div
          className="mt-4 flex items-center justify-start sm:justify-center gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          data-testid="landing-hero-chips"
        >
          {HOMEPAGE_TOPIC_CHIPS.map((chip) => (
            <Link
              key={chip.topic}
              href={`/experts?topic=${chip.topic}`}
              className="inline-flex h-11 shrink-0 items-center rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)] px-4 text-[13px] font-medium text-[var(--landing-muted)] transition-colors hover:border-[var(--landing-muted)] hover:text-[var(--landing-text)]"
            >
              {chip.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
