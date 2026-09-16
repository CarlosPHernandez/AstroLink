import { NextResponse } from 'next/server';
import { assertMentorCanPublish } from '@/lib/expert-offers/guards';
import { toExpertOfferListItem } from '@/lib/expert-offers/path';
import { publishOfferAtomic } from '@/lib/expert-offers/publish-atomic';
import {
  loadOwnedOffer,
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
  const next = applyOfferTransition(offer, 'publish', nowIso);
  if ('error' in next) {
    return NextResponse.json({ error: next.error }, { status: 400 });
  }

  const blocked = assertMentorCanPublish(mentor);
  if (blocked) {
    return NextResponse.json({ error: blocked }, { status: 400 });
  }

  const published = await publishOfferAtomic({
    offerId: offer.id,
    mentorId: mentor.id,
    nowIso,
  });
  if (!published.ok) {
    const status = published.error === 'Not found' ? 404 : 400;
    return NextResponse.json({ error: published.error }, { status });
  }

  return NextResponse.json(toExpertOfferListItem(published.offer, mentor.slug ?? mentor.id));
}
