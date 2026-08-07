import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';

/**
 * Compact Space Path Assessment strip above the landing header.
 * Stitch structure (badge + title + CTA), scaled as page chrome — not a hero promo.
 */
export function LandingAssessmentBar() {
  return (
    <div
      className="border-b border-[var(--landing-border)] bg-[var(--landing-surface)]"
      data-testid="landing-assessment-bar"
    >
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-3 gap-y-2 px-md py-2 sm:px-lg sm:py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
          <span className="inline-flex shrink-0 items-center rounded-full bg-[var(--landing-ink)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-white font-mono leading-none">
            Free
          </span>
          <p className="min-w-0 text-[12px] leading-snug text-[var(--landing-text)] sm:text-[13px]">
            <span className="font-semibold">Space Path Assessment</span>
            <span className="text-[var(--landing-faint)]" aria-hidden>
              {' '}
              —{' '}
            </span>
            <span className="text-[var(--landing-muted)]">know where you stand in 2–3 minutes</span>
          </p>
        </div>

        <Link
          href="/assessment"
          className="inline-flex h-8 shrink-0 touch-manipulation items-center justify-center gap-1 rounded-full bg-[var(--landing-accent)] px-3 text-[12px] font-semibold text-white transition-colors hover:bg-[var(--landing-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-accent)] focus-visible:ring-offset-1"
          data-testid="landing-assessment-bar-link"
        >
          Start free assessment
          <MaterialIcon name="arrow_forward" size={14} className="text-white" />
        </Link>
      </div>
    </div>
  );
}
