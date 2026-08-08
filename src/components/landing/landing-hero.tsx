'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';
import { landingHeroPortrait } from '@/lib/landing/featured-expert';
import { trackSpaHeroLinkClick, trackSpaOfferClick } from '@/lib/path-assessment/path-assessment-analytics';
import type { ListedExpert } from '@/lib/mentor-directory';

const ASSESSMENT_HREF = '/assessment';
const EXPERTS_HREF = '/experts';

const STEPS = [
  { title: 'Answer a few questions', body: 'Stage, goals, and obstacles — about 2–3 minutes.' },
  { title: 'Get your free report', body: 'On the page and in your inbox. No account required.' },
  { title: 'Go deeper if you want', body: 'Book live 1:1 or a written expert review of that report.' },
] as const;

type LandingHeroProps = {
  experts: ListedExpert[];
};

/**
 * Assessment-first marketing hero.
 * Primary CTA is the free Space Path Assessment (the working magnet).
 * Compact on mobile: no tall portrait + phone stack.
 */
export default function LandingHero({ experts }: LandingHeroProps) {
  const { src: heroImage, alt: heroAlt } = landingHeroPortrait(experts);

  return (
    <section
      className="landing-hero-section border-b border-[var(--landing-border)] pt-6 sm:pt-10 lg:pt-12 pb-8 sm:pb-12 lg:pb-14"
      data-testid="landing-hero"
      aria-labelledby="landing-hero-title"
    >
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg">
        {/*
          Mobile: single short column (copy → CTA → steps).
          Desktop: copy + compact portrait card — not a full-viewport portrait stack.
        */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-7 sm:gap-8 lg:gap-12 lg:items-center">
          <div className="min-w-0 text-center lg:text-left">
            <p
              className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--landing-faint)]"
              data-testid="landing-hero-eyebrow"
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--landing-accent)]"
                aria-hidden
              />
              Free Space Path Assessment
            </p>

            <h1
              id="landing-hero-title"
              data-testid="landing-hero-title"
              className="mt-3 font-landing-display text-[1.5rem] leading-[1.18] sm:text-[2rem] lg:text-[2.35rem] font-semibold tracking-tight text-[var(--landing-text)] text-balance"
            >
              Find out where you stand in space — and what to do next
            </h1>

            <p
              className="mt-3 sm:mt-4 text-sm sm:text-base text-[var(--landing-muted)] leading-relaxed max-w-prose mx-auto lg:mx-0 text-pretty"
              data-testid="landing-hero-subcopy"
            >
              A free personalized readiness report from your goals and background. Then book a live
              1:1 with a verified operator when you want real advice — not a generic AI answer.
            </p>

            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-2.5 sm:gap-3">
              <Link
                href={ASSESSMENT_HREF}
                onClick={() => {
                  trackSpaOfferClick();
                  trackSpaHeroLinkClick();
                }}
                className="inline-flex min-h-11 sm:min-h-12 w-full sm:w-auto touch-manipulation items-center justify-center gap-1.5 rounded-full bg-[var(--landing-ink)] px-5 sm:px-6 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-ink)] focus-visible:ring-offset-2"
                data-testid="landing-hero-assessment-cta"
              >
                Start free assessment
                <MaterialIcon name="arrow_forward" size={16} className="text-white shrink-0" />
              </Link>
              <Link
                href={EXPERTS_HREF}
                className="inline-flex min-h-11 sm:min-h-12 w-full sm:w-auto touch-manipulation items-center justify-center rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)] px-5 sm:px-6 text-sm font-medium text-[var(--landing-text)] hover:bg-[var(--landing-surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-ink)] focus-visible:ring-offset-2"
                data-testid="landing-hero-experts-cta"
              >
                Browse experts
              </Link>
            </div>

            <p className="mt-3 text-xs sm:text-sm text-[var(--landing-faint)] leading-snug">
              Free · 2–3 min · report on page + email · no account
            </p>
          </div>

          {/* Compact visual — constrained height on all breakpoints */}
          <div className="min-w-0 w-full max-w-[22rem] sm:max-w-[26rem] mx-auto lg:max-w-none lg:mx-0">
            <div
              className="relative overflow-hidden rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface)] shadow-[0_16px_40px_-28px_rgba(14,20,32,0.22)]"
              data-testid="landing-hero-visual"
            >
              <div className="relative aspect-[4/3] sm:aspect-[5/4] max-h-[220px] sm:max-h-[280px] lg:max-h-[320px] w-full">
                <Image
                  src={heroImage}
                  alt={heroAlt}
                  fill
                  priority
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 90vw, 420px"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--landing-ink)]/55 via-transparent to-transparent"
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4 text-left">
                  <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-white/75">
                    Then talk live with
                  </p>
                  <p className="mt-0.5 text-sm sm:text-base font-semibold text-white">
                    Verified aerospace experts
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How it works — 3-up from sm; short cards on mobile, not full-viewport blocks */}
        <ol
          className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3"
          data-testid="landing-hero-steps"
        >
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-3 rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface)] px-3.5 py-3 sm:flex-col sm:gap-2 sm:px-4 sm:py-4 text-left min-w-0"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--landing-ink)] text-[11px] font-semibold text-white sm:h-8 sm:w-8 sm:text-xs">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--landing-text)] leading-snug">
                  {step.title}
                </p>
                <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-[var(--landing-muted)] leading-relaxed">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
