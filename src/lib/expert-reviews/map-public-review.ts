import type { ExpertReviewRow, PublicExpertReview } from '@/lib/expert-reviews/types';

const MAX_PUBLIC_REVIEWS = 3;

export function isPubliclyVisibleReview(row: Pick<ExpertReviewRow, 'status' | 'consent_to_publish'>): boolean {
  return row.status === 'approved' && row.consent_to_publish === true;
}

function clampRating(rating: number): 1 | 2 | 3 | 4 | 5 | null {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return null;
  }
  return rating as 1 | 2 | 3 | 4 | 5;
}

/**
 * Map a DB row to the public DTO. Returns null if the row must not be shown
 * (status/consent, invalid rating, empty quote/name).
 */
export function mapToPublicExpertReview(row: ExpertReviewRow): PublicExpertReview | null {
  if (!isPubliclyVisibleReview(row)) {
    return null;
  }

  const rating = clampRating(row.rating);
  if (rating === null) {
    return null;
  }

  const quote = row.quote?.trim() ?? '';
  const displayName = row.display_name?.trim() ?? '';
  if (quote.length < 20 || displayName.length < 2) {
    return null;
  }

  return {
    id: row.id,
    rating,
    quote,
    displayName,
    verifiedSession: Boolean(row.booking_id),
  };
}

/** Defense-in-depth filter after a DB query (or for unit tests). Caps at 3. */
export function filterPublicReviews(rows: ExpertReviewRow[]): PublicExpertReview[] {
  const out: PublicExpertReview[] = [];
  for (const row of rows) {
    const mapped = mapToPublicExpertReview(row);
    if (mapped) {
      out.push(mapped);
    }
    if (out.length >= MAX_PUBLIC_REVIEWS) {
      break;
    }
  }
  return out;
}

export { MAX_PUBLIC_REVIEWS };
