import { NextResponse } from 'next/server';
import type { Database } from '@/lib/database.types';
import type { ExpertOfferStatus } from '@/lib/expert-offers/types';
import { toExpertOfferListItem } from '@/lib/expert-offers/path';
import { requireMentorOffersAccess } from '@/lib/expert-offers/resolve-mentor';
import { OfferWriteSchema } from '@/lib/expert-offers/schema';
import { nextOfferSlug, slugifyOfferTitle } from '@/lib/expert-offers/slug';
import { supabaseAdmin } from '@/lib/supabase';

type ExpertOfferRow = Database['public']['Tables']['expert_offers']['Row'];

const STATUS_RANK: Record<ExpertOfferStatus, number> = {
  published: 0,
  draft: 1,
  unpublished: 2,
  archived: 3,
};

export async function GET() {
  const access = await requireMentorOffersAccess();
  if (access instanceof NextResponse) return access;
  const { mentor } = access;

  const { data, error } = await supabaseAdmin
    .from('expert_offers')
    .select('*')
    .eq('mentor_id', mentor.id)
    .order('status')
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = [...((data ?? []) as ExpertOfferRow[])].sort((a, b) => {
    const byStatus = (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99);
    if (byStatus !== 0) return byStatus;
    return b.updated_at.localeCompare(a.updated_at);
  });

  return NextResponse.json({
    items: rows.map((row) => toExpertOfferListItem(row, mentor.slug ?? mentor.id)),
  });
}

export async function POST(request: Request) {
  const access = await requireMentorOffersAccess();
  if (access instanceof NextResponse) return access;
  const { mentor } = access;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = OfferWriteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 },
    );
  }

  const { data: slugRows, error: slugError } = await supabaseAdmin
    .from('expert_offers')
    .select('slug')
    .eq('mentor_id', mentor.id);

  if (slugError) {
    return NextResponse.json({ error: slugError.message }, { status: 500 });
  }

  const slug = nextOfferSlug(
    slugifyOfferTitle(parsed.data.title),
    (slugRows ?? []).map((row) => row.slug),
  );

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('expert_offers')
    .insert({
      mentor_id: mentor.id,
      title: parsed.data.title,
      slug,
      description: parsed.data.description,
      duration_minutes: parsed.data.duration_minutes,
      price_cents: parsed.data.price_cents,
      status: 'draft',
    })
    .select('*')
    .single();

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: insertError?.message ?? 'Could not create session.' },
      { status: 500 },
    );
  }

  return NextResponse.json(
    toExpertOfferListItem(inserted as ExpertOfferRow, mentor.slug ?? mentor.id),
  );
}
