import Link from 'next/link';

/**
 * Thin non-sticky top bar for Space Path Assessment (PR-A).
 * Hairline border, muted text — not a forever sticky banner.
 */
export function LandingAssessmentBar() {
  return (
    <div
      className="border-b border-[var(--landing-border)] bg-[var(--landing-surface)]"
      data-testid="landing-assessment-bar"
    >
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg py-2 sm:py-2.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs sm:text-[13px] text-[var(--landing-muted)]">
        <span>Not sure where you stand?</span>
        <Link
          href="/assessment"
          className="font-medium text-[var(--landing-text)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-ink)] focus-visible:ring-offset-2 rounded-sm"
          data-testid="landing-assessment-bar-link"
        >
          Free Space Path Assessment →
        </Link>
      </div>
    </div>
  );
}
