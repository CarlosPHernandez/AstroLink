import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  pathAssessmentBookingPath,
  pathAssessmentResultsPath,
} from '@/lib/path-assessment/public-url';
import { isValidPathAssessmentToken } from '@/lib/path-assessment/tokens';
import { supabaseAdmin } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'Written review status | AstroLink',
  robots: { index: false, follow: false },
};

export default async function WrittenReviewStatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: raw } = await params;
  const token = raw?.trim() ?? '';
  if (!isValidPathAssessmentToken(token)) notFound();

  const { data: review } = await supabaseAdmin
    .from('path_assessment_reviews')
    .select('*')
    .eq('public_token', token)
    .maybeSingle();

  if (!review) notFound();

  const { data: mentor } = await supabaseAdmin
    .from('mentors')
    .select('full_name')
    .eq('id', review.mentor_id)
    .maybeSingle();

  const { data: assessment } = await supabaseAdmin
    .from('path_assessments')
    .select('public_token')
    .eq('id', review.path_assessment_id)
    .maybeSingle();

  const assessmentToken = assessment?.public_token ?? '';

  return (
    <div className="landing-mission min-h-screen bg-[var(--landing-canvas)] text-[var(--landing-text)] font-landing-body">
      <header className="border-b border-[var(--landing-border)] bg-[var(--landing-surface)]">
        <div className="max-w-[1200px] mx-auto px-md sm:px-lg h-14 flex items-center">
          <Link href="/" className="font-landing-wordmark text-sm font-semibold">
            AstroLink
          </Link>
        </div>
      </header>
      <main className="max-w-[720px] mx-auto px-md sm:px-lg py-10 space-y-6">
        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--landing-faint)]">
          Written expert review
        </p>
        <h1 className="font-landing-display text-2xl font-semibold">
          {review.status === 'delivered' ? 'Your written review is ready' : 'Review in progress'}
        </h1>
        <p className="text-sm text-[var(--landing-muted)]">
          Expert: <span className="text-[var(--landing-text)] font-medium">{mentor?.full_name ?? 'Expert'}</span>
          {' · '}
          Status: <span className="font-medium text-[var(--landing-text)]">{review.status.replace(/_/g, ' ')}</span>
        </p>

        {review.status === 'delivered' && review.written_response ? (
          <article className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)] p-5 sm:p-7 whitespace-pre-wrap text-sm leading-relaxed">
            {review.written_response}
          </article>
        ) : (
          <p className="text-sm text-[var(--landing-muted)] leading-relaxed">
            We&apos;ll email you when {mentor?.full_name ?? 'your expert'} delivers the written review.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {assessmentToken ? (
            <>
              <Link
                href={pathAssessmentResultsPath(assessmentToken)}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--landing-border)] px-5 text-sm font-medium"
              >
                View free report
              </Link>
              <Link
                href={pathAssessmentBookingPath(assessmentToken)}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--landing-ink)] px-5 text-sm font-semibold text-white"
              >
                Book live review with report
              </Link>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
