'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { MaterialIcon } from '@/components/ui/material-icon';
import {
  trackSpaHeroLinkClick,
  trackSpaOfferClick,
} from '@/lib/path-assessment/path-assessment-analytics';

const ASSESSMENT_HREF = '/assessment';
const EXPERTS_HREF = '/experts';
const HERO_HEADLINE = 'flight controllers';

const AUDIENCE_CHIPS = ['Student', 'Career switcher', 'Team / org'] as const;

/**
 * Search-first marketing hero (2026-08 redesign).
 * Primary CTA is still the free Space Path Assessment; search routes to /experts?q=.
 */
export default function LandingHero() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const onSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/experts?q=${encodeURIComponent(trimmed)}` : EXPERTS_HREF);
  };

  return (
    <section
      className="landing-hero-section border-b border-[var(--landing-border)] pt-10 sm:pt-14 lg:pt-16 pb-8 sm:pb-12 lg:pb-14"
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
          Verified expert network · aerospace
        </p>

        <h1
          id="landing-hero-title"
          data-testid="landing-hero-title"
          className="mt-3 font-landing-display text-[1.75rem] leading-[1.15] sm:text-[2.35rem] lg:text-[2.75rem] font-extrabold tracking-tight text-[var(--landing-text)] text-balance"
        >
          Talk to {HERO_HEADLINE}.
        </h1>

        <p className="mt-3 sm:mt-4 text-sm sm:text-base text-[var(--landing-muted)] leading-relaxed max-w-prose mx-auto text-pretty">
          Book a live 1:1 video session with a verified aerospace expert — an astronaut, a flight
          controller, a propulsion engineer. A real conversation with someone who has done the
          work, not a search result.
        </p>

        <form
          onSubmit={onSearchSubmit}
          className="mt-6 flex items-center gap-2 max-w-[560px] mx-auto rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)] py-2 pl-5 pr-2 shadow-[0_12px_36px_-22px_rgba(14,20,32,0.2)]"
          data-testid="landing-hero-search"
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="What do you want to learn?"
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

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {AUDIENCE_CHIPS.map((chip) => (
            <Link
              key={chip}
              href={ASSESSMENT_HREF}
              className="rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)] px-4 py-2 text-[13px] font-medium text-[var(--landing-muted)] transition-colors hover:border-[var(--landing-muted)] hover:text-[var(--landing-text)]"
            >
              {chip}
            </Link>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
          <Link
            href={ASSESSMENT_HREF}
            onClick={() => {
              trackSpaOfferClick();
              trackSpaHeroLinkClick();
            }}
            className="inline-flex min-h-12 touch-manipulation items-center justify-center gap-1.5 rounded-full bg-[var(--landing-ink)] px-6 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)] focus-visible:ring-offset-2"
            data-testid="landing-hero-assessment-cta"
          >
            Start free assessment
            <MaterialIcon name="arrow_forward" size={16} className="text-white shrink-0" />
          </Link>
          <Link
            href={EXPERTS_HREF}
            className="inline-flex min-h-12 touch-manipulation items-center justify-center text-sm font-semibold text-[var(--landing-text)] hover:text-[var(--landing-accent)]"
            data-testid="landing-hero-experts-cta"
          >
            Browse experts
          </Link>
        </div>

        <p className="mt-6 text-xs sm:text-sm text-[var(--landing-faint)]">
          Verified experts &nbsp;·&nbsp; Live 1:1 video &nbsp;·&nbsp; Clear pricing
        </p>
      </div>
    </section>
  );
}
