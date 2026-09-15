import type { OfferDurationMinutes } from '@/lib/expert-offers/constants';

export type ExpertOfferStatus = 'draft' | 'published' | 'unpublished' | 'archived';

export type OfferSnapshot = {
  offer_id: string;
  title: string;
  slug: string;
  duration_minutes: OfferDurationMinutes | number;
  price_cents: number;
};

export type ExpertOfferListItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  status: ExpertOfferStatus;
  published_at: string | null;
  public_url: string;
  page_views: number;
  checkout_starts: number;
  bookings_paid: number;
};
