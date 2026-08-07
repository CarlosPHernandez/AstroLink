import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { WrittenReviewCheckout } from '@/components/path-assessment/written-review-checkout';
import { isValidPathAssessmentToken } from '@/lib/path-assessment/tokens';
import { supabaseAdmin } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'Written expert review | AstroLink',
  robots: { index: false, follow: false },
};

export default async function WrittenReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ assessment?: string }>;
}) {
  const sp = await searchParams;
  const token = sp.assessment?.trim() ?? '';
  if (!token || !isValidPathAssessmentToken(token)) {
    notFound();
  }

  const { data: assessment } = await supabaseAdmin
    .from('path_assessments')
    .select('first_name, email, status')
    .eq('public_token', token)
    .maybeSingle();

  if (!assessment) {
    notFound();
  }
  if (assessment.status !== 'ready') {
    redirect(`/assessment/results/${encodeURIComponent(token)}`);
  }

  const { data: mentors } = await supabaseAdmin
    .from('mentors')
    .select('slug, full_name, title, written_report_reviews_enabled, compliance_status, is_listed')
    .eq('compliance_status', 'approved')
    .eq('is_listed', true)
    .eq('written_report_reviews_enabled', true)
    .order('full_name');

  const experts = (mentors ?? [])
    .filter((m) => m.slug)
    .map((m) => ({
      slug: m.slug as string,
      name: m.full_name,
      role: m.title ?? 'Aerospace expert',
    }));

  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? '';

  return (
    <div className="landing-mission min-h-screen bg-[var(--landing-canvas)] text-[var(--landing-text)] font-landing-body">
      <header className="border-b border-[var(--landing-border)] bg-[var(--landing-surface)]">
        <div className="max-w-[1200px] mx-auto px-md sm:px-lg h-14 flex items-center justify-between">
          <Link href="/" className="font-landing-wordmark text-sm font-semibold">
            AstroLink
          </Link>
          <Link
            href={`/assessment/results/${encodeURIComponent(token)}`}
            className="text-sm text-[var(--landing-muted)] hover:text-[var(--landing-text)]"
          >
            Back to report
          </Link>
        </div>
      </header>
      <main className="max-w-[1000px] mx-auto px-md sm:px-lg py-8 sm:py-12 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <WrittenReviewCheckout
          assessmentToken={token}
          firstName={assessment.first_name}
          email={assessment.email}
          experts={experts}
          stripePublishableKey={stripeKey}
        />
      </main>
    </div>
  );
}
