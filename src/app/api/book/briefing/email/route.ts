import { NextResponse } from 'next/server';
import { z } from 'zod';
import { canRefreshBriefing } from '@/lib/briefing-auth';
import type { BriefingPayload } from '@/lib/briefing-display';
import { briefingContentReady } from '@/lib/briefing-display';
import { buildMenteeBriefEmail } from '@/lib/email/mentee-brief-email';
import { isNotificationsDisabled } from '@/lib/email/notification-env';
import { sendEmail } from '@/lib/email/resend-client';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';

const BodySchema = z.object({
  bookingId: z.string().uuid(),
});

/**
 * Send the mentee their full pre-call brief on demand (Chris modal "Send to my email").
 * Separate from APX-08 confirmation emails — may be called multiple times.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (isNotificationsDisabled()) {
    return NextResponse.json(
      { success: false, error: 'Email delivery is disabled in this environment.' },
      { status: 503 },
    );
  }

  try {
    const { bookingId } = BodySchema.parse(await request.json());

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select(
        'id, scheduled_at, briefing_json, mentee_id, mentor_id, users(full_name, email), mentors(full_name)',
      )
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    if (
      !canRefreshBriefing({
        sessionUserId: session.userId,
        sessionRole: session.role,
        bookingMenteeId: booking.mentee_id,
        bookingMentorId: booking.mentor_id,
      })
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const briefing = (booking.briefing_json as BriefingPayload | null) ?? null;
    if (!briefing || !briefingContentReady(briefing, 'mentee')) {
      return NextResponse.json(
        { success: false, error: 'Brief is not ready yet. Try again in a moment.' },
        { status: 409 },
      );
    }

    const mentee = booking.users as { full_name: string; email: string } | null;
    const mentor = booking.mentors as { full_name: string } | null;
    const email = mentee?.email?.trim();

    if (!email) {
      return NextResponse.json({ success: false, error: 'No email on file for your account.' }, { status: 400 });
    }

    const built = buildMenteeBriefEmail({
      menteeName: mentee?.full_name ?? 'there',
      mentorName: mentor?.full_name ?? 'your expert',
      scheduledAt: booking.scheduled_at,
      briefing,
    });

    const result = await sendEmail({
      to: email,
      subject: built.subject,
      html: built.html,
    });

    if ('skipped' in result) {
      return NextResponse.json({ success: false, error: result.reason }, { status: 503 });
    }

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      data: { sentTo: email },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not send brief email';
    const status = error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}