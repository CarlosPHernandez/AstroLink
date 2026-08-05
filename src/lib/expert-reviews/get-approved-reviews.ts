import 'server-only';

import { unstable_cache } from 'next/cache';
import { filterPublicReviews } from '@/lib/expert-reviews/map-public-review';
import type { ExpertReviewRow, PublicExpertReview } from '@/lib/expert-reviews/types';
import { supabase } from '@/lib/supabase';

const REVIEW_CACHE_SECONDS = 300;

function hasPublicSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

async function fetchApprovedReviewsFromDb(expertId: string): Promise<PublicExpertReview[]> {
  if (!hasPublicSupabaseConfig() || !expertId.trim()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('expert_reviews')
      .select('id, rating, quote, display_name, consent_to_publish, status, booking_id')
      .eq('expert_id', expertId)
      .eq('status', 'approved')
      .eq('consent_to_publish', true)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('getApprovedReviewsForExpert:', error.message);
      return [];
    }

    return filterPublicReviews((data ?? []) as ExpertReviewRow[]);
  } catch (err) {
    console.error('getApprovedReviewsForExpert unexpected:', err);
    return [];
  }
}

/** Public approved reviews for an expert profile. Fail-soft: never throws. */
export async function getApprovedReviewsForExpert(
  expertId: string,
): Promise<PublicExpertReview[]> {
  const id = expertId.trim();
  if (!id) {
    return [];
  }

  return unstable_cache(
    () => fetchApprovedReviewsFromDb(id),
    ['expert-reviews-by-expert', id],
    {
      revalidate: REVIEW_CACHE_SECONDS,
      tags: ['expert-reviews', `expert-reviews-${id}`],
    },
  )();
}
