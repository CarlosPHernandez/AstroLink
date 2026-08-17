import 'server-only';

import { unstable_cache } from 'next/cache';
import type { DirectoryReviewSummary } from '@/lib/directory-expert';
import { supabase } from '@/lib/supabase';

const REVIEW_CACHE_SECONDS = 300;

export type ExpertReviewSummary = DirectoryReviewSummary;

function hasPublicSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

function aggregateSummaries(
  rows: Array<{ expert_id: string; rating: number }>,
): Record<string, ExpertReviewSummary> {
  const buckets = new Map<string, { sum: number; count: number }>();
  for (const row of rows) {
    if (!Number.isFinite(row.rating) || row.rating < 1) continue;
    const current = buckets.get(row.expert_id) ?? { sum: 0, count: 0 };
    current.sum += row.rating;
    current.count += 1;
    buckets.set(row.expert_id, current);
  }

  const summaries: Record<string, ExpertReviewSummary> = {};
  for (const [expertId, bucket] of buckets) {
    if (bucket.count === 0) continue;
    summaries[expertId] = {
      average: Math.round((bucket.sum / bucket.count) * 10) / 10,
      count: bucket.count,
    };
  }
  return summaries;
}

async function fetchDirectoryReviewSummariesFromDb(
  expertIds: string[],
): Promise<Record<string, ExpertReviewSummary>> {
  if (!hasPublicSupabaseConfig() || expertIds.length === 0) {
    return {};
  }

  try {
    const { data, error } = await supabase
      .from('expert_reviews')
      .select('expert_id, rating')
      .in('expert_id', expertIds)
      .eq('status', 'approved')
      .eq('consent_to_publish', true);

    if (error) {
      console.error('getDirectoryReviewSummaries:', error.message);
      return {};
    }

    return aggregateSummaries((data ?? []) as Array<{ expert_id: string; rating: number }>);
  } catch (err) {
    console.error('getDirectoryReviewSummaries unexpected:', err);
    return {};
  }
}

/** Approved, consented ratings only. Experts with no public reviews are omitted. */
export async function getDirectoryReviewSummaries(
  expertIds: string[],
): Promise<Record<string, ExpertReviewSummary>> {
  const ids = [...new Set(expertIds.map((id) => id.trim()).filter(Boolean))].sort();
  if (ids.length === 0) {
    return {};
  }

  return unstable_cache(
    () => fetchDirectoryReviewSummariesFromDb(ids),
    ['expert-review-summaries', ids.join(',')],
    {
      revalidate: REVIEW_CACHE_SECONDS,
      tags: ['expert-reviews'],
    },
  )();
}

export function summarizeDirectoryReviewsForTest(
  rows: Array<{ expert_id: string; rating: number }>,
): Record<string, ExpertReviewSummary> {
  return aggregateSummaries(rows);
}
