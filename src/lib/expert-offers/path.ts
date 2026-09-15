import type { ExpertOfferListItem } from '@/lib/expert-offers/types';

export function offerPublicPath(mentorSlug: string, offerSlug: string): string {
  return `/s/${mentorSlug}/${offerSlug}`;
}

export function toExpertOfferListItem(
  row: Omit<ExpertOfferListItem, 'public_url'>,
  mentorSlug: string,
): ExpertOfferListItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    duration_minutes: row.duration_minutes,
    price_cents: row.price_cents,
    status: row.status,
    published_at: row.published_at,
    public_url: offerPublicPath(mentorSlug, row.slug),
    page_views: row.page_views,
    checkout_starts: row.checkout_starts,
    bookings_paid: row.bookings_paid,
  };
}
