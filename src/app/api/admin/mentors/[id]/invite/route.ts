import { NextResponse } from 'next/server';

import { requireApiRole } from '@/lib/api-auth';
import { sendEmail } from '@/lib/email/resend-client';
import { buildMentorActivationEmailHtml } from '@/lib/mentor-activation/email-template';
import {
  buildActivateUrl,
  createMentorInvite,
  MentorInviteError,
  revokeMentorInvites,
} from '@/lib/mentor-activation/invite';
import { InviteMentorBodySchema } from '@/lib/mentor-activation/schemas';
import { formLevelSummary, toFieldErrors } from '@/lib/zod-field-errors';
import { supabaseAdmin } from '@/lib/supabase';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/mentors/[id]/invite — create claim token + email magic-link invite via Resend.
 * DELETE — revoke pending invites.
 */
export async function POST(request: Request, context: RouteContext) {
  const sessionOrResponse = await requireApiRole('admin');
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  const { id: mentorId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = InviteMentorBodySchema.safeParse(body);
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
    const invite = await createMentorInvite({
      mentorId,
      email: parsed.data.email,
      expiresInHours: parsed.data.expiresInHours,
      createdBy: sessionOrResponse.userId,
    });

    const { data: mentor } = await supabaseAdmin
      .from('mentors')
      .select('full_name')
      .eq('id', mentorId)
      .maybeSingle();

    const activateUrl = buildActivateUrl(invite.rawToken);
    const html = buildMentorActivationEmailHtml({
      expertName: mentor?.full_name ?? 'Expert',
      activateUrl,
      expiresAtIso: invite.expiresAt,
    });

    const emailResult = await sendEmail({
      to: invite.email,
      subject: 'Activate your AstroLink expert account',
      html,
    });

    if ('ok' in emailResult && emailResult.ok === false) {
      return NextResponse.json(
        {
          success: false,
          error: `Invite created but email failed: ${emailResult.error}`,
          mentorId: invite.mentorId,
          expiresAt: invite.expiresAt,
        },
        { status: 502 },
      );
    }

    // Ensure Auth user exists (confirmed) so magic link can sign them in.
    try {
      const { error: createAuthErr } = await supabaseAdmin.auth.admin.createUser({
        email: invite.email,
        email_confirm: true,
        user_metadata: {
          full_name: mentor?.full_name ?? 'Expert',
        },
      });
      if (
        createAuthErr &&
        !/already|registered|exists/i.test(createAuthErr.message ?? '')
      ) {
        console.error('invite createUser:', createAuthErr.message);
      }
    } catch (authErr: unknown) {
      console.error('invite createUser:', authErr);
      // Non-fatal: claim step can still create/link.
    }

    return NextResponse.json({
      success: true,
      mentorId: invite.mentorId,
      email: invite.email,
      expiresAt: invite.expiresAt,
      emailDelivery:
        'skipped' in emailResult
          ? { skipped: true, reason: emailResult.reason }
          : { sent: true, messageId: emailResult.messageId },
    });
  } catch (err: unknown) {
    if (err instanceof MentorInviteError) {
      const status =
        err.code === 'not_found' ? 404 : err.code === 'conflict' ? 409 : 400;
      return NextResponse.json({ success: false, error: err.message }, { status });
    }
    const message = err instanceof Error ? err.message : 'Invite failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const sessionOrResponse = await requireApiRole('admin');
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  const { id: mentorId } = await context.params;
  try {
    await revokeMentorInvites(mentorId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Revoke failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
