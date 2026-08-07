import Link from 'next/link';

/**
 * Non-sticky top discovery bar for Space Path Assessment.
 * Stronger CTA than plain text link — still restrained to DESIGN.md tokens.
 */
export function LandingAssessmentBar() {
  return (
    <div
      className="border-b border-[var(--landing-border)] bg-[var(--landing-surface)]"
      data-testid="landing-assessment-bar"
    >
      <div className="max-w-[1200px] mx-auto px-md sm:px-lg py-2.5 sm:py-3 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2.5 sm:gap-4">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 gap-y-1.5 text-center sm:text-left">
          <span className="inline-flex items-center rounded-full bg-[var(--landing-ink)] px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-white">
            Free
          </span>
          <p className="text-xs sm:text-[13px] text-[var(--landing-text)] leading-snug">
            <span className="font-semibold">Space Path Assessment</span>
            <span className="text-[var(--landing-muted)]">
              {' '}
              — know where you stand in 2–3 minutes
            </span>
          </p>
        </div>
        <Link
          href="/assessment"
          className="inline-flex min-h-9 shrink-0 touch-manipulation items-center justify-center gap-1.5 rounded-full bg-[var(--landing-accent)] px-4 py-1.5 text-xs sm:text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(14,20,32,0.12)] transition-colors hover:bg-[color:var(--landing-accent-hover,#1247AE)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)] focus-visible:ring-offset-2"
          data-testid="landing-assessment-bar-link"
        >
          Start free assessment
          <span aria-hidden className="text-white/90">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
