import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiRole } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { ReviewAgent } from '@/services/agents/review-agent';

const ReviewStatusSchema = z.enum(['pending', 'approved', 'hidden', 'withdrawn']);
const ReviewActionSchema = z.object({
  reviewId: z.string().uuid('reviewId must be a valid UUID.'),
  action: z.enum(['approve', 'hide', 'withdraw']),
});

export async function GET(request: Request) {
  const sessionOrResponse = await requireApiRole('admin');
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  const statusParam = new URL(request.url).searchParams.get('status') ?? 'pending';
  const parsedStatus = ReviewStatusSchema.safeParse(statusParam);

  if (!parsedStatus.success) {
    return NextResponse.json(
      { success: false, error: 'status must be one of pending, approved, hidden, or withdrawn.' },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from('expert_reviews')
    .select(
      'id, expert_id, booking_id, reviewer_user_id, rating, quote, display_name, attribution_type, consent_to_publish, status, source, created_at, approved_at, approved_by, mentors(id, full_name, slug), bookings(status)',
    )
    .eq('status', parsedStatus.data)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, reviews: data ?? [] });
}

export async function POST(request: Request) {
  const sessionOrResponse = await requireApiRole('admin');
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  const body = await request.json();
  const parsed = ReviewActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const agent = new ReviewAgent();

  try {
    switch (parsed.data.action) {
      case 'approve':
        await agent.approveReview(parsed.data.reviewId, sessionOrResponse.userId);
        break;
      case 'hide':
        await agent.hideReview(parsed.data.reviewId, sessionOrResponse.userId);
        break;
      case 'withdraw':
        await agent.withdrawReview(parsed.data.reviewId, sessionOrResponse.userId);
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, reviewId: parsed.data.reviewId, status: parsed.data.action });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not update review.';
    const status =
      message.includes('not found') ? 404 : message.includes('consent') ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
