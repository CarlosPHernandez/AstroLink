import { NextResponse } from 'next/server';
import type { Database } from '@/lib/database.types';
import { canEditPriceDuration, canEditSlug } from '@/lib/expert-offers/guards';
import { toExpertOfferListItem } from '@/lib/expert-offers/path';
import { requireMentorOffersAccess } from '@/lib/expert-offers/resolve-mentor';
import { OfferPatchSchema } from '@/lib/expert-offers/schema';
import { nextOfferSlug, slugifyOfferTitle } from '@/lib/expert-offers/slug';
import { supabaseAdmin } from '@/lib/supabase';

type ExpertOfferRow = Database['public']['Tables']['expert_offers']['Row'];
type ExpertOfferUpdate = Database['public']['Tables']['expert_offers']['Update'];

async function loadOwnedOffer(
  offerId: string,
  mentorId: string,
): Promise<ExpertOfferRow | NextResponse> {
  const { data, error } = await supabaseAdmin
    .from('expert_offers')
    .select('*')
    .eq('id', offerId)
    .eq('mentor_id', mentorId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return data as ExpertOfferRow;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ offerId: string }> },
) {
  const access = await requireMentorOffersAccess();
  if (access instanceof NextResponse) return access;
  const { mentor } = access;

  const { offerId } = await context.params;
  const offer = await loadOwnedOffer(offerId, mentor.id);
  if (offer instanceof NextResponse) return offer;

  return NextResponse.json(toExpertOfferListItem(offer, mentor.slug ?? mentor.id));
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ offerId: string }> },
) {
  const access = await requireMentorOffersAccess();
  if (access instanceof NextResponse) return access;
  const { mentor } = access;

  const { offerId } = await context.params;
  const offer = await loadOwnedOffer(offerId, mentor.id);
  if (offer instanceof NextResponse) return offer;

  if (offer.status === 'archived') {
    return NextResponse.json({ error: 'Archived sessions cannot be edited.' }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = OfferPatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 },
    );
  }

  const patch = parsed.data;
  const changingPriceDuration =
    (patch.duration_minutes !== undefined && patch.duration_minutes !== offer.duration_minutes) ||
    (patch.price_cents !== undefined && patch.price_cents !== offer.price_cents);

  if (changingPriceDuration) {
    const { data: paid, error: paidError } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('expert_offer_id', offer.id)
      .in('status', ['confirmed', 'completed'])
      .limit(1)
      .maybeSingle();

    if (paidError) {
      return NextResponse.json({ error: paidError.message }, { status: 500 });
    }

    const hasPaidBooking = Boolean(paid);
    if (!canEditPriceDuration({ publishedAt: offer.published_at, hasPaidBooking })) {
      return NextResponse.json(
        { error: 'Create a new session to change price or duration.' },
        { status: 400 },
      );
    }
  }

  const update: ExpertOfferUpdate = { updated_at: new Date().toISOString() };
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.duration_minutes !== undefined) update.duration_minutes = patch.duration_minutes;
  if (patch.price_cents !== undefined) update.price_cents = patch.price_cents;

  if (patch.title !== undefined) {
    update.title = patch.title;
    if (patch.title !== offer.title && canEditSlug(offer.published_at)) {
      const { data: slugRows, error: slugError } = await supabaseAdmin
        .from('expert_offers')
        .select('slug')
        .eq('mentor_id', mentor.id)
        .neq('id', offer.id);

      if (slugError) {
        return NextResponse.json({ error: slugError.message }, { status: 500 });
      }

      update.slug = nextOfferSlug(
        slugifyOfferTitle(patch.title),
        (slugRows ?? []).map((row) => row.slug),
      );
    }
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('expert_offers')
    .update(update)
    .eq('id', offer.id)
    .eq('mentor_id', mentor.id)
    .select('*')
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { error: updateError?.message ?? 'Could not update session.' },
      { status: 500 },
    );
  }

  return NextResponse.json(
    toExpertOfferListItem(updated as ExpertOfferRow, mentor.slug ?? mentor.id),
  );
}
