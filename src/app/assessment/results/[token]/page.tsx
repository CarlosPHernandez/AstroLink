import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AssessmentReportView } from '@/components/path-assessment/assessment-report-view';
import { SpaResultsViewTracker } from '@/components/path-assessment/spa-analytics-effects';
import {
  PathAssessmentAnswersSchema,
  PathAssessmentReportSchema,
  type PathAssessmentPublicView,
  type PathAssessmentStatus,
} from '@/lib/path-assessment/schema';
import { isValidPathAssessmentToken } from '@/lib/path-assessment/tokens';
import { countWrittenReviewMentors } from '@/lib/path-assessment/written-review-mentors';
import { supabaseAdmin } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'Your Space Path Assessment | AstroLink',
  robots: { index: false, follow: false },
};

async function loadAssessment(token: string): Promise<PathAssessmentPublicView | null> {
  if (!isValidPathAssessmentToken(token)) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from('path_assessments')
    .select(
      'public_token, status, first_name, answers_json, report_json, report_html, created_at',
    )
    .eq('public_token', token)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const answersParsed = PathAssessmentAnswersSchema.safeParse(data.answers_json);
  if (!answersParsed.success) {
    return null;
  }

  let report = null;
  if (data.report_json) {
    const reportParsed = PathAssessmentReportSchema.safeParse(data.report_json);
    if (reportParsed.success) {
      report = reportParsed.data;
    }
  }

  const status = (['pending', 'ready', 'failed'].includes(data.status)
    ? data.status
    : 'pending') as PathAssessmentStatus;

  return {
    token: data.public_token,
    status,
    firstName: data.first_name,
    answers: answersParsed.data,
    report,
    reportHtml: data.report_html,
    createdAt: data.created_at,
  };
}

export default async function AssessmentResultsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: raw } = await params;
  const view = await loadAssessment(raw?.trim() ?? '');
  if (!view) {
    notFound();
  }

  const writtenMentorCount = await countWrittenReviewMentors();
  const showWrittenReviewCta = writtenMentorCount > 0;

  return (
    <div className="landing-mission min-h-screen bg-[var(--landing-canvas)] text-[var(--landing-text)] font-landing-body">
      <SpaResultsViewTracker />
      <header className="border-b border-[var(--landing-border)] bg-[var(--landing-surface)]">
        <div className="max-w-[1200px] mx-auto px-md sm:px-lg h-14 flex items-center justify-between">
          <Link
            href="/"
            className="font-landing-wordmark text-sm font-semibold text-[var(--landing-text)]"
          >
            AstroLink
          </Link>
          <Link
            href="/assessment"
            className="text-sm text-[var(--landing-muted)] hover:text-[var(--landing-text)]"
          >
            New assessment
          </Link>
        </div>
      </header>

      <main className="max-w-[960px] mx-auto px-md sm:px-lg py-8 sm:py-12 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--landing-faint)] mb-6">
          Your Space Path Assessment
        </p>
        <AssessmentReportView view={view} showWrittenReviewCta={showWrittenReviewCta} />
      </main>
    </div>
  );
}
