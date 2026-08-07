import { NextResponse } from 'next/server';
import { isValidPathAssessmentToken } from '@/lib/path-assessment/tokens';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token: raw } = await context.params;
  const token = raw?.trim() ?? '';
  if (!isValidPathAssessmentToken(token)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin
    .from('path_assessment_reviews')
    .select(
      'public_token, status, buyer_name, amount_cents, written_response, delivered_at, due_at, created_at, mentor_id, path_assessment_id',
    )
    .eq('public_token', token)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: mentor } = await supabaseAdmin
    .from('mentors')
    .select('full_name, slug')
    .eq('id', data.mentor_id)
    .maybeSingle();

  const { data: assessment } = await supabaseAdmin
    .from('path_assessments')
    .select('public_token, first_name')
    .eq('id', data.path_assessment_id)
    .maybeSingle();

  return NextResponse.json({
    token: data.public_token,
    status: data.status,
    buyerName: data.buyer_name,
    amountCents: data.amount_cents,
    writtenResponse: data.status === 'delivered' ? data.written_response : null,
    deliveredAt: data.delivered_at,
    dueAt: data.due_at,
    createdAt: data.created_at,
    mentorName: mentor?.full_name ?? 'Expert',
    mentorSlug: mentor?.slug ?? null,
    assessmentToken: assessment?.public_token ?? null,
  });
}
