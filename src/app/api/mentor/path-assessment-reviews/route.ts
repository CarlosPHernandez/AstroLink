import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'mentor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: mentor } = await supabaseAdmin
    .from('mentors')
    .select('id')
    .eq('user_id', session.userId)
    .maybeSingle();

  if (!mentor) {
    return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin
    .from('path_assessment_reviews')
    .select(
      'id, public_token, status, buyer_name, buyer_email, amount_cents, due_at, paid_at, delivered_at, created_at, path_assessment_id, written_response',
    )
    .eq('mentor_id', mentor.id)
    .in('status', ['paid', 'in_progress', 'delivered'])
    .order('due_at', { ascending: true, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const assessmentIds = [...new Set(rows.map((r) => r.path_assessment_id))];
  let assessmentMap = new Map<
    string,
    { public_token: string; first_name: string; answers_json: unknown; report_json: unknown }
  >();

  if (assessmentIds.length > 0) {
    const { data: assessments } = await supabaseAdmin
      .from('path_assessments')
      .select('id, public_token, first_name, answers_json, report_json')
      .in('id', assessmentIds);
    assessmentMap = new Map(
      (assessments ?? []).map((a) => [
        a.id,
        {
          public_token: a.public_token,
          first_name: a.first_name,
          answers_json: a.answers_json,
          report_json: a.report_json,
        },
      ]),
    );
  }

  return NextResponse.json({
    reviews: rows.map((r) => {
      const a = assessmentMap.get(r.path_assessment_id);
      return {
        id: r.id,
        publicToken: r.public_token,
        status: r.status,
        buyerName: r.buyer_name,
        buyerEmail: r.buyer_email,
        amountCents: r.amount_cents,
        dueAt: r.due_at,
        paidAt: r.paid_at,
        deliveredAt: r.delivered_at,
        createdAt: r.created_at,
        writtenResponse: r.written_response,
        assessment: a
          ? {
              token: a.public_token,
              firstName: a.first_name,
              answers: a.answers_json,
              report: a.report_json,
            }
          : null,
      };
    }),
  });
}
