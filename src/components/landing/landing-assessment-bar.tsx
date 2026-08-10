'use client';

import Link from 'next/link';
import { trackSpaBarClick } from '@/lib/path-assessment/path-assessment-analytics';

/**
 * Top announcement bar (2026-08-10 redesign) — matches the mockup exactly:
 * white surface, ink FREE pill, plain text CTA link (not a button).
 */
export function LandingAssessmentBar() {
  return (
    <div
      className="border-b border-[var(--landing-border)] bg-[var(--landing-surface)]"
      data-testid="landing-assessment-bar"
    >
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-x-2 gap-y-1 px-md py-1.5 text-[12px] sm:py-2.5 sm:px-lg sm:text-[13px]">
        <span className="inline-flex shrink-0 items-center rounded-full bg-[var(--landing-ink)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-white">
          Free
        </span>
        <strong className="font-semibold text-[var(--landing-text)] sm:hidden">
          Space Path Assessment
        </strong>
        <span className="hidden text-[var(--landing-muted)] sm:inline">
          <strong className="font-semibold text-[var(--landing-text)]">Space Path Assessment</strong>
          {' '}— know where you stand in 2–3 minutes
        </span>
        <Link
          href="/assessment"
          onClick={() => trackSpaBarClick()}
          className="font-semibold text-[var(--landing-accent)] hover:text-[var(--landing-text)] hover:underline"
          data-testid="landing-assessment-bar-link"
        >
          Start now →
        </Link>
      </div>
    </div>
  );
}
