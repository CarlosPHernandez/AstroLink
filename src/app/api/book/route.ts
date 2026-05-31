import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { BookingAgent } from '@/services/agents/booking-agent';

const BookBodySchema = z.object({
  mentorId: z.string().uuid().optional(),
  serviceType: z.enum(['session_1on1', 'pre_call_brief']),
  includePreCallBrief: z.boolean().optional(),
  scheduledAt: z.string().min(1),
  goals: z.string().min(10),
  background: z.string().min(10),
});

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
        matchReason: result.matchReason,
        amountCents: result.amountCents,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Booking failed';
    const status = error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
