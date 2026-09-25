import { NextResponse } from 'next/server';
import { incrementOfferCounter } from '@/lib/expert-offers/counters';
import { loadPublicOffer } from '@/lib/expert-offers/load-public-offer';

export async function POST(
  _request: Request,
  context: { params: Promise<{ mentorSlug: string; offerSlug: string }> },
) {
  const { mentorSlug, offerSlug } = await context.params;
  const loaded = await loadPublicOffer(mentorSlug, offerSlug);
  if (!loaded) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await incrementOfferCounter(loaded.offer.id, 'page_views');
  return NextResponse.json({ ok: true });
}
