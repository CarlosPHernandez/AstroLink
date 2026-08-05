import { describe, expect, it } from 'vitest';
import {
  filterPublicReviews,
  isPubliclyVisibleReview,
  mapToPublicExpertReview,
} from '@/lib/expert-reviews/map-public-review';
import type { ExpertReviewRow } from '@/lib/expert-reviews/types';

function baseRow(overrides: Partial<ExpertReviewRow> = {}): ExpertReviewRow {
  return {
    id: 'rev-1',
    rating: 5,
    quote: 'Chris made space careers feel real and achievable for me.',
    display_name: 'Verified Astro-Link user',
    consent_to_publish: true,
    status: 'approved',
    booking_id: 'book-1',
    ...overrides,
  };
}

describe('isPubliclyVisibleReview', () => {
  it('requires approved status and consent', () => {
    expect(isPubliclyVisibleReview(baseRow())).toBe(true);
    expect(isPubliclyVisibleReview(baseRow({ status: 'pending' }))).toBe(false);
    expect(isPubliclyVisibleReview(baseRow({ status: 'hidden' }))).toBe(false);
    expect(isPubliclyVisibleReview(baseRow({ status: 'withdrawn' }))).toBe(false);
    expect(isPubliclyVisibleReview(baseRow({ consent_to_publish: false }))).toBe(false);
  });
});

describe('mapToPublicExpertReview', () => {
  it('maps public fields and verified session flag', () => {
    expect(mapToPublicExpertReview(baseRow())).toEqual({
      id: 'rev-1',
      rating: 5,
      quote: 'Chris made space careers feel real and achievable for me.',
      displayName: 'Verified Astro-Link user',
      verifiedSession: true,
    });
  });

  it('sets verifiedSession false when booking_id is null', () => {
    expect(mapToPublicExpertReview(baseRow({ booking_id: null }))?.verifiedSession).toBe(false);
  });

  it('returns null for pending, hidden, withdrawn, or no consent', () => {
    expect(mapToPublicExpertReview(baseRow({ status: 'pending' }))).toBeNull();
    expect(mapToPublicExpertReview(baseRow({ status: 'hidden' }))).toBeNull();
    expect(mapToPublicExpertReview(baseRow({ consent_to_publish: false }))).toBeNull();
  });

  it('returns null for invalid rating or short quote', () => {
    expect(mapToPublicExpertReview(baseRow({ rating: 0 }))).toBeNull();
    expect(mapToPublicExpertReview(baseRow({ rating: 6 }))).toBeNull();
    expect(mapToPublicExpertReview(baseRow({ quote: 'Too short' }))).toBeNull();
    expect(mapToPublicExpertReview(baseRow({ display_name: ' ' }))).toBeNull();
  });

  it('does not include sensitive fields on the DTO', () => {
    const mapped = mapToPublicExpertReview(baseRow())!;
    expect(Object.keys(mapped).sort()).toEqual(
      ['displayName', 'id', 'quote', 'rating', 'verifiedSession'].sort(),
    );
  });
});

describe('filterPublicReviews', () => {
  it('filters non-public rows and caps at three', () => {
    const rows = [
      baseRow({ id: 'a' }),
      baseRow({ id: 'b', status: 'pending' }),
      baseRow({ id: 'c' }),
      baseRow({ id: 'd' }),
      baseRow({ id: 'e' }),
    ];
    const publicReviews = filterPublicReviews(rows);
    expect(publicReviews).toHaveLength(3);
    expect(publicReviews.map((r) => r.id)).toEqual(['a', 'c', 'd']);
  });

  it('returns empty array for empty input', () => {
    expect(filterPublicReviews([])).toEqual([]);
  });
});
