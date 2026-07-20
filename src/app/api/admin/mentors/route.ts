import { NextResponse } from 'next/server';

import { requireApiRole } from '@/lib/api-auth';
import {
  CreateMentorBodySchema,
  createOrUpdateMentor,
} from '@/lib/admin-create-mentor';
import { formLevelSummary, toFieldErrors } from '@/lib/zod-field-errors';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/admin/mentors — list mentors (ops).
 * POST /api/admin/mentors — create or update mentor by email.
 */
export async function GET() {
  const sessionOrResponse = await requireApiRole('admin');
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  const { data, error } = await supabaseAdmin
    .from('mentors')
    .select(
      'id, email, full_name, slug, live_session_price_cents, is_listed, compliance_status, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    mentors: (data ?? []).map((m) => ({
      id: m.id,
      email: m.email,
      fullName: m.full_name,
      slug: m.slug,
      liveSessionPriceCents: m.live_session_price_cents,
      isListed: m.is_listed,
      complianceStatus: m.compliance_status,
      bookHref: m.slug ? `/booking?mentor=${encodeURIComponent(m.slug)}` : null,
    })),
  });
}

export async function POST(request: Request) {
  const sessionOrResponse = await requireApiRole('admin');
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = CreateMentorBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: formLevelSummary(),
        fieldErrors: toFieldErrors(parsed.error),
      },
      { status: 400 },
    );
  }

  try {
    const mentor = await createOrUpdateMentor(parsed.data);
    return NextResponse.json({ success: true, mentor });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save mentor';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
