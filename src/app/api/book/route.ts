import { NextResponse } from 'next/server';
import { BookBodySchema } from '@/lib/book-request-schema';
import { formLevelSummary, toFieldErrors } from '@/lib/zod-field-errors';
import {
  assertBookingRateLimit,
  getBookingClientKey,
  isBookingRateLimitError,
} from '@/lib/booking-rate-limit';
import { screenBookingIntake } from '@/lib/intake-moderation';
import { isLlmRateLimitError } from '@/lib/llm';
import { ChrisCampaignSoldOutError } from '@/lib/chris-campaign/chris-campaign-slots';
import { resolveChrisCampaignForBooking } from '@/lib/chris-campaign/validate-chris-booking';
import { getSession } from '@/lib/session';
import { BookingAgent } from '@/services/agents/booking-agent';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'mentee') {
      return NextResponse.json({ success: false, error: 'Sign in as a buyer to book.' }, { status: 401 });
    }

    const clientKey = getBookingClientKey(request, session.userId);
    try {
      assertBookingRateLimit(clientKey);
    } catch (rateErr) {
      if (isBookingRateLimitError(rateErr)) {
        return NextResponse.json(
          { success: false, error: rateErr.message },
          {
            status: 429,
            headers: { 'Retry-After': String(Math.ceil(rateErr.retryAfterMs / 1000)) },
          },
        );
      }
      throw rateErr;
    }

    const parsed = BookBodySchema.safeParse(await request.json());
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
    const body = parsed.data;

    const moderation = await screenBookingIntake({
      goals: body.goals,
      background: body.background,
    });
    if (!moderation.allowed) {
      return NextResponse.json({ success: false, error: moderation.reason }, { status: 422 });
    }

    const scheduledAt = body.scheduledAt.includes('T')
      ? new Date(body.scheduledAt).toISOString()
      : new Date(body.scheduledAt).toISOString();

    let chrisCampaign: Awaited<ReturnType<typeof resolveChrisCampaignForBooking>>;
    try {
      chrisCampaign = await resolveChrisCampaignForBooking({
        campaign: body.campaign,
        mentorId: body.mentorId,
      });
    } catch (campaignError: unknown) {
      const message =
        campaignError instanceof Error ? campaignError.message : 'Invalid booking campaign.';
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    const agent = new BookingAgent();
    const result = await agent.bookSession({
      menteeId: session.userId,
      mentorId: chrisCampaign?.mentorId ?? body.mentorId,
      serviceType: body.serviceType,
      includePreCallBrief: body.includePreCallBrief ?? false,
      scheduledAt,
      menteeGoals: body.goals,
      menteeBackground: body.background,
      durationMinutes: body.durationMinutes,
      campaignId: chrisCampaign?.campaignId,
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
    if (error instanceof ChrisCampaignSoldOutError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
    if (isLlmRateLimitError(error)) {
      return NextResponse.json(
        { success: false, error: error.message },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(error.retryAfterMs / 1000)) },
        },
      );
    }
    const message = error instanceof Error ? error.message : "We couldn't complete your booking. Try again.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

