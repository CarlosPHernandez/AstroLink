import { NextResponse } from 'next/server';
import { z } from 'zod';
import { formLevelSummary, toFieldErrors } from '@/lib/zod-field-errors';
import { getSession } from '@/lib/session';
import { ReviewAgent } from '@/services/agents/review-agent';

const ReviewSubmissionSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  quote: z.string().trim().min(20).max(600),
  // Align with DB CHECK on expert_reviews.display_name (2–80).
  displayName: z.string().trim().min(2).max(80),
  attributionType: z.enum([
    'anonymous',
    'role_only',
    'first_name_only',
    'organization',
    'full_name',
  ]),
  consentToPublish: z.boolean(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'mentee') {
    return NextResponse.json({ success: false, error: 'Sign in as a buyer to leave feedback.' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = ReviewSubmissionSchema.safeParse(body);
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

  const agent = new ReviewAgent();

  try {
    const result = await agent.submitReview({
      bookingId: parsed.data.bookingId,
      reviewerUserId: session.userId,
      rating: parsed.data.rating,
      quote: parsed.data.quote,
      displayName: parsed.data.displayName,
      attributionType: parsed.data.attributionType,
      consentToPublish: parsed.data.consentToPublish,
      source: 'post_session_survey',
    });

    // Never expose moderation diagnosis to mentees.
    return NextResponse.json({
      success: true,
      data: {
        reviewId: result.reviewId,
        status: result.status,
        autoPublished: result.autoPublished,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      const message = error.message;
      if (message === 'Booking not found') {
        return NextResponse.json({ success: false, error: message }, { status: 404 });
      }
      if (message === 'Forbidden') {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
      if (
        message.includes('completed sessions') ||
        message.includes('already exists') ||
        message.includes('Review may only be submitted')
      ) {
        return NextResponse.json({ success: false, error: message }, { status: 409 });
      }
      if (
        message.includes('Quote must be') ||
        message.includes('displayName') ||
        message.includes('rating must') ||
        message.includes('bookingId is required')
      ) {
        return NextResponse.json({ success: false, error: message }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }

    return NextResponse.json({ success: false, error: 'Unable to submit review.' }, { status: 500 });
  }
}
