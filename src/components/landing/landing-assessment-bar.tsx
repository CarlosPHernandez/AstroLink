import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';

/**
 * Space Path Assessment promo banner — Stitch pill layout, AstroLink DESIGN tokens.
 * Non-sticky; sits above the landing header.
 */
export function LandingAssessmentBar() {
  return (
    <div
      className="bg-[var(--landing-surface-soft)] px-md sm:px-lg py-3 sm:py-4"
      data-testid="landing-assessment-bar"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="flex w-full flex-col items-center justify-between gap-3 rounded-full border border-[color:color-mix(in_srgb,var(--landing-border)_70%,transparent)] bg-[var(--landing-surface)] px-4 py-3 shadow-sm sm:flex-row sm:gap-4 sm:px-6 sm:py-3">
          <div className="flex w-full flex-col items-center gap-3 text-center sm:w-auto sm:flex-row sm:gap-4 sm:text-left">
            <span className="inline-flex shrink-0 items-center rounded-full bg-[var(--landing-ink)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-white font-mono">
              Free
            </span>
            <div className="flex flex-col items-center gap-0.5 sm:flex-row sm:items-baseline sm:gap-1">
              <span className="font-landing-display text-lg font-semibold leading-8 tracking-tight text-[var(--landing-text)] sm:text-2xl sm:leading-8">
                Space Path Assessment
              </span>
              <span className="mx-1 hidden text-[var(--landing-faint)] sm:inline" aria-hidden>
                —
              </span>
              <span className="text-sm leading-6 text-[var(--landing-muted)] sm:text-base">
                know where you stand in 2–3 minutes
              </span>
            </div>
          </div>

          <Link
            href="/assessment"
            className="inline-flex w-full shrink-0 touch-manipulation items-center justify-center gap-2 rounded-full bg-[var(--landing-accent)] px-6 py-3 text-sm font-semibold text-white transition-[background-color,transform,filter] duration-200 hover:bg-[var(--landing-accent-hover)] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)] focus-visible:ring-offset-2 active:scale-[0.98] sm:w-auto sm:hover:scale-[1.03]"
            data-testid="landing-assessment-bar-link"
          >
            Start free assessment
            <MaterialIcon name="arrow_forward" size={18} className="text-white" />
          </Link>
        </div>
      </div>
    </div>
  );
}
