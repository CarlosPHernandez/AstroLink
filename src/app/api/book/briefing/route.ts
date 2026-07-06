import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isLlmRateLimitError } from '@/lib/llm';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';
import { canRefreshBriefing } from '@/lib/briefing-auth';
import { BriefingAgent } from '@/services/agents/briefing-agent';

const BodySchema = z.object({
  bookingId: z.string().uuid(),
});

/**
 * Manually generate or refresh APX-02 briefing for a booking.
 * POST /api/book/briefing { "bookingId": "..." }
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { bookingId } = BodySchema.parse(await request.json());

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('id, mentee_id, mentor_id, status')
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

    if (booking.status !== 'confirmed' && booking.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Payment has not been confirmed for this booking.' },
        { status: 409 },
      );
    }

    const briefingAgent = new BriefingAgent();
    const briefing = await briefingAgent.prepareBriefing(bookingId);

    return NextResponse.json({ success: true, data: { briefing } });
  } catch (error: unknown) {
    if (isLlmRateLimitError(error)) {
      return NextResponse.json(
        { success: false, error: error.message },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(error.retryAfterMs / 1000)) },
        },
      );
    }

    const message = error instanceof Error ? error.message : 'Briefing generation failed';
    const status = error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
