import { NextResponse } from 'next/server';
import { toExpertOfferListItem } from '@/lib/expert-offers/path';
import {
  loadOwnedOffer,
  persistOfferTimestamps,
  requireMentorOffersAccess,
} from '@/lib/expert-offers/resolve-mentor';
import { applyOfferTransition } from '@/lib/expert-offers/status';

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

  const nowIso = new Date().toISOString();
  const next = applyOfferTransition(offer, 'unpublish', nowIso);
  if ('error' in next) {
    return NextResponse.json({ error: next.error }, { status: 400 });
  }

  const updated = await persistOfferTimestamps(offer.id, mentor.id, next, nowIso);
  if (updated instanceof NextResponse) return updated;

  return NextResponse.json(toExpertOfferListItem(updated, mentor.slug ?? mentor.id));
}
