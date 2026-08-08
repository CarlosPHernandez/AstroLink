import 'server-only';

import { unstable_cache } from 'next/cache';
import { mapToPublicExpertReview } from '@/lib/expert-reviews/map-public-review';
import type { ExpertReviewRow, PublicExpertReview } from '@/lib/expert-reviews/types';
import { supabase } from '@/lib/supabase';

const LANDING_REVIEW_LIMIT = 6;
const REVIEW_CACHE_SECONDS = 300;

export type LandingPublicReview = PublicExpertReview & {
  expertName: string | null;
  expertSlug: string | null;
};

type ReviewJoinRow = ExpertReviewRow & {
  expert_id: string;
  mentors:
    | { full_name: string; slug: string | null }
    | { full_name: string; slug: string | null }[]
    | null;
};

function hasPublicSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

function mentorFields(
  mentors: ReviewJoinRow['mentors'],
): { full_name: string; slug: string | null } | null {
  if (!mentors) return null;
  if (Array.isArray(mentors)) return mentors[0] ?? null;
  return mentors;
}

async function fetchLandingPublicReviewsFromDb(): Promise<LandingPublicReview[]> {
  if (!hasPublicSupabaseConfig()) {
    return [];
  }

  try {
    // Marketing surface: only strong quotes (4–5★). Profile pages can still show more.
    const { data, error } = await supabase
      .from('expert_reviews')
      .select(
        'id, rating, quote, display_name, consent_to_publish, status, booking_id, expert_id, mentors!expert_reviews_expert_id_fkey(full_name, slug)',
      )
      .eq('status', 'approved')
      .eq('consent_to_publish', true)
      .gte('rating', 4)
      .order('created_at', { ascending: false })
      .limit(LANDING_REVIEW_LIMIT);

    if (error) {
      console.error('getLandingPublicReviews:', error.message);
      return [];
    }

    const out: LandingPublicReview[] = [];
    for (const raw of (data ?? []) as ReviewJoinRow[]) {
      const mapped = mapToPublicExpertReview(raw);
      if (!mapped) continue;
      const mentor = mentorFields(raw.mentors);
      out.push({
        ...mapped,
        expertName: mentor?.full_name?.trim() || null,
        expertSlug: mentor?.slug?.trim() || null,
      });
    }
    return out;
  } catch (err) {
    console.error('getLandingPublicReviews unexpected:', err);
    return [];
  }
}

/** Approved, consented reviews for the marketing landing. Fail-soft. */
export async function getLandingPublicReviews(): Promise<LandingPublicReview[]> {
  return unstable_cache(
    () => fetchLandingPublicReviewsFromDb(),
    ['landing-public-reviews-v2-min4'],
    {
      revalidate: REVIEW_CACHE_SECONDS,
      tags: ['expert-reviews', 'landing-public-reviews'],
    },
  )();
}
