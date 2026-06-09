import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isLlmRateLimitError } from '@/lib/llm';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';
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

    if (booking.mentee_id !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
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

