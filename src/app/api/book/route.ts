import { NextResponse } from 'next/server';
import { z } from 'zod';
import { BookBodySchema } from '@/lib/book-request-schema';
import { isLlmRateLimitError } from '@/lib/llm';
import { getSession } from '@/lib/session';
import { BookingAgent } from '@/services/agents/booking-agent';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'mentee') {
      return NextResponse.json({ success: false, error: 'Sign in as a buyer to book.' }, { status: 401 });
    }

    const body = BookBodySchema.parse(await request.json());

    const scheduledAt = body.scheduledAt.includes('T')
      ? new Date(body.scheduledAt).toISOString()
      : new Date(body.scheduledAt).toISOString();

    const agent = new BookingAgent();
    const result = await agent.bookSession({
      menteeId: session.userId,
      mentorId: body.mentorId,
      serviceType: body.serviceType,
      includePreCallBrief: body.includePreCallBrief ?? false,
      scheduledAt,
      menteeGoals: body.goals,
      menteeBackground: body.background,
    });

    return NextResponse.json({
      success: true,
      data: {
        bookingId: result.bookingId,
        clientSecret: result.stripeClientSecret,
        skipPayment: result.skipPayment,
        matchReason: result.matchReason,
        amountCents: result.amountCents,
      },
    });
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
    const message = error instanceof Error ? error.message : 'Booking failed';
    const status = error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
