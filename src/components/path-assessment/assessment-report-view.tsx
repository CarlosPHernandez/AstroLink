import Link from 'next/link';
import {
  pathAssessmentBookingPath,
  pathAssessmentWrittenReviewPath,
} from '@/lib/path-assessment/public-url';
import { WRITTEN_REPORT_REVIEW_CENTS } from '@/lib/path-assessment/written-review-pricing';
import type { PathAssessmentPublicView, PathAssessmentReport } from '@/lib/path-assessment/schema';

function ReportBody({ report }: { report: PathAssessmentReport }) {
  return (
    <div className="space-y-8" data-testid="path-assessment-report">
      <header>
        <h1 className="font-landing-display text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--landing-text)] leading-snug">
          {report.headline}
        </h1>
        <p className="mt-4 text-[0.9375rem] sm:text-base text-[var(--landing-text)] leading-relaxed">
          {report.standing_summary}
        </p>
      </header>

      <section>
        <h2 className="text-[11px] font-mono uppercase tracking-[0.16em] text-[var(--landing-faint)] mb-3">
          Key gaps
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {report.key_gaps.map((gap) => (
            <li
              key={gap.title}
              className="rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface)] px-4 py-4 sm:px-5"
            >
              <p className="font-semibold text-[var(--landing-text)]">{gap.title}</p>
              <p className="mt-1.5 text-sm text-[var(--landing-muted)] leading-relaxed">{gap.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-[11px] font-mono uppercase tracking-[0.16em] text-[var(--landing-faint)] mb-3">
          Focus areas
        </h2>
        <ul className="flex flex-wrap gap-2">
          {report.focus_areas.map((area) => (
            <li
              key={area}
              className="rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface-soft)] px-3 py-1.5 text-sm text-[var(--landing-text)]"
            >
              {area}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-[11px] font-mono uppercase tracking-[0.16em] text-[var(--landing-faint)] mb-3">
          Best expert conversation
        </h2>
        <p className="text-[0.9375rem] text-[var(--landing-text)] leading-relaxed">
          {report.expert_conversation_type}
        </p>
      </section>

      <section>
        <h2 className="text-[11px] font-mono uppercase tracking-[0.16em] text-[var(--landing-faint)] mb-3">
          Next actions
        </h2>
        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 list-none">
          {report.next_actions.map((item, index) => (
            <li
              key={`${index}-${item.action}`}
              className="flex flex-col gap-2 rounded-xl border border-[var(--landing-border)] bg-[var(--landing-surface)] px-4 py-4 sm:px-5"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--landing-ink)] text-xs font-semibold text-white">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-[var(--landing-text)] leading-snug">{item.action}</p>
                <p className="mt-1 text-sm text-[var(--landing-muted)] leading-relaxed">{item.why}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export function AssessmentLiveCta({ token }: { token: string }) {
  const href = pathAssessmentBookingPath(token);
  return (
    <aside
      className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)] p-5 sm:p-6 shadow-[0_8px_28px_-20px_rgba(14,20,32,0.25)]"
      data-testid="path-assessment-live-cta"
    >
      <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--landing-faint)]">
        Recommended next step
      </p>
      <h2 className="mt-2 font-landing-display text-lg sm:text-xl font-semibold text-[var(--landing-text)] tracking-tight">
        Want a verified expert to review this report with you live?
      </h2>
      <p className="mt-2 text-sm text-[var(--landing-muted)] leading-relaxed">
        We&apos;ll load your assessment so they can prepare specific advice for your situation.
      </p>
      <Link
        href={href}
        className="mt-5 inline-flex min-h-11 w-full sm:w-auto touch-manipulation items-center justify-center rounded-full bg-[var(--landing-ink)] px-5 sm:px-6 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-ink)] focus-visible:ring-offset-2"
        data-testid="path-assessment-book-live"
      >
        <span className="sm:hidden">Book live expert review</span>
        <span className="hidden sm:inline">Book live expert review with my report</span>
      </Link>
    </aside>
  );
}

export function AssessmentWrittenReviewCta({ token }: { token: string }) {
  const href = pathAssessmentWrittenReviewPath(token);
  const dollars = Math.round(WRITTEN_REPORT_REVIEW_CENTS / 100);
  return (
    <aside
      className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface-soft)] p-5 sm:p-6"
      data-testid="path-assessment-written-cta"
    >
      <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--landing-faint)]">
        Lower commitment option
      </p>
      <h2 className="mt-2 font-landing-display text-base sm:text-lg font-semibold text-[var(--landing-text)] tracking-tight">
        Not ready for a live session?
      </h2>
      <p className="mt-2 text-sm text-[var(--landing-muted)] leading-relaxed">
        Get a written expert review of this exact report — async, within 3–5 business days.
      </p>
      <Link
        href={href}
        className="mt-4 inline-flex min-h-11 w-full sm:w-auto touch-manipulation items-center justify-center rounded-full border-2 border-[var(--landing-ink)] bg-transparent px-5 sm:px-6 text-sm font-semibold text-[var(--landing-ink)] hover:bg-[var(--landing-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-ink)] focus-visible:ring-offset-2"
        data-testid="path-assessment-book-written"
      >
        <span className="sm:hidden">Written review · ${dollars}</span>
        <span className="hidden sm:inline">Get a written expert review — ${dollars}</span>
      </Link>
    </aside>
  );
}

export function AssessmentReportView({
  view,
  showWrittenReviewCta = false,
}: {
  view: PathAssessmentPublicView;
  showWrittenReviewCta?: boolean;
}) {
  if (!view.report) {
    return (
      <div className="text-center py-12" data-testid="path-assessment-pending">
        <p className="text-[var(--landing-text)] font-medium">Your report is still generating.</p>
        <p className="mt-2 text-sm text-[var(--landing-muted)]">
          Refresh in a moment, or check your email.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {view.firstName ? (
        <p className="text-sm text-[var(--landing-muted)]">
          Personalized for{' '}
          <span className="text-[var(--landing-text)] font-medium">{view.firstName}</span>
        </p>
      ) : null}
      <ReportBody report={view.report} />
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.9fr] gap-4 sm:gap-5">
        <AssessmentLiveCta token={view.token} />
        {showWrittenReviewCta ? <AssessmentWrittenReviewCta token={view.token} /> : null}
      </div>
    </div>
  );
}
