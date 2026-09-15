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
      className="hidden sm:block border-b border-[var(--landing-border)] bg-[var(--landing-surface)]"
      data-testid="landing-assessment-bar"
    >
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-x-2 gap-y-1 px-md py-2.5 sm:px-lg text-[13px]">
        <span className="text-[var(--landing-muted)]">
          Not sure who to book? Free 3-minute path assessment
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
