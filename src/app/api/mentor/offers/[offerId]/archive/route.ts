import { NextResponse } from 'next/server';
import { isBookingUpcoming } from '@/lib/booking-partition';
import { assertCanArchive } from '@/lib/expert-offers/guards';
import { toExpertOfferListItem } from '@/lib/expert-offers/path';
import {
  loadOwnedOffer,
  persistOfferTimestamps,
  requireMentorOffersAccess,
} from '@/lib/expert-offers/resolve-mentor';
import { applyOfferTransition } from '@/lib/expert-offers/status';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  _request: Request,
  context: { params: Promise<{ offerId: string }> },
) {
  const access = await requireMentorOffersAccess();
  if (access instanceof NextResponse) return access;
  const { mentor } = access;

  const { offerId } = await context.params;
  const offer = await loadOwnedOffer(offerId, mentor.id);
  if (offer instanceof NextResponse) return offer;

  const { data: bookings, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('status, scheduled_at, duration_minutes')
    .eq('expert_offer_id', offer.id)
    .eq('status', 'confirmed');

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }

  const now = new Date();
  const hasUpcomingConfirmed = (bookings ?? []).some((row) =>
    isBookingUpcoming(
      {
        status: row.status,
        scheduledAt: row.scheduled_at,
        durationMinutes: row.duration_minutes,
      },
      now,
    ),
  );

  const blocked = assertCanArchive(hasUpcomingConfirmed);
  if (blocked) {
    return NextResponse.json({ error: blocked }, { status: 409 });
  }

  const nowIso = now.toISOString();
  const next = applyOfferTransition(offer, 'archive', nowIso);
  if ('error' in next) {
    return NextResponse.json({ error: next.error }, { status: 400 });
  }

  const updated = await persistOfferTimestamps(offer.id, mentor.id, next, nowIso);
  if (updated instanceof NextResponse) return updated;

  return NextResponse.json(toExpertOfferListItem(updated, mentor.slug ?? mentor.id));
}
