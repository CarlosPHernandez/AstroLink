import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';

/**
 * Compact Space Path Assessment strip above the landing header.
 * Mobile: short copy + compact CTA; desktop: fuller line.
 */
export function LandingAssessmentBar() {
  return (
    <div
      className="border-b border-[var(--landing-border)] bg-[var(--landing-surface)]"
      data-testid="landing-assessment-bar"
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-2 px-md py-1.5 sm:gap-3 sm:px-lg sm:py-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2.5">
          <span className="inline-flex shrink-0 items-center rounded-full bg-[var(--landing-ink)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-white font-mono leading-none sm:px-2 sm:text-[10px]">
            Free
          </span>
          <p className="min-w-0 truncate text-[11px] leading-snug text-[var(--landing-text)] sm:text-[13px] sm:overflow-visible sm:whitespace-normal">
            <span className="font-semibold">Space Path Assessment</span>
            <span className="hidden text-[var(--landing-muted)] sm:inline">
              {' '}
              — know where you stand in 2–3 minutes
            </span>
          </p>
        </div>

        <Link
          href="/assessment"
          className="inline-flex h-7 sm:h-8 shrink-0 touch-manipulation items-center justify-center gap-0.5 sm:gap-1 rounded-full bg-[var(--landing-accent)] px-2.5 sm:px-3 text-[11px] sm:text-[12px] font-semibold text-white transition-colors hover:bg-[var(--landing-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)] focus-visible:ring-offset-1"
          data-testid="landing-assessment-bar-link"
        >
          <span className="sm:hidden">Start</span>
          <span className="hidden sm:inline">Start free assessment</span>
          <MaterialIcon name="arrow_forward" size={14} className="text-white" />
        </Link>
      </div>
    </div>
  );
}
