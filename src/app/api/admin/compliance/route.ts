import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/api-auth';
import { revalidateMentorDirectory } from '@/lib/revalidate-mentors';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const ComplianceActionSchema = z.object({
  mentorId: z.string().uuid('mentorId must be a valid UUID.'),
  action: z.enum(['approve', 'reject']),
});

export async function POST(request: Request) {
  const sessionOrResponse = await requireApiRole('admin');
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  try {
    const body = await request.json();
    const parsed = ComplianceActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { mentorId, action } = parsed.data;

    const patch =
      action === 'approve'
        ? { compliance_status: 'approved' as const, is_listed: true }
        : { compliance_status: 'rejected' as const, is_listed: false };

    const { data, error } = await supabaseAdmin
      .from('mentors')
      .update(patch)
      .eq('id', mentorId)
      .select('id')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ success: false, error: 'Mentor not found.' }, { status: 404 });
    }

    await supabaseAdmin.from('audit_log').insert({
      agent_id: 'APX-04',
      event: action === 'approve' ? 'MENTOR_COMPLIANCE_APPROVED' : 'MENTOR_COMPLIANCE_REJECTED',
      ref_id: mentorId,
      payload: { action, admin_user_id: sessionOrResponse.userId },
    });

    revalidateMentorDirectory();

    return NextResponse.json({
      success: true,
      message: `Mentor ${mentorId} successfully ${action}d.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Compliance update failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}