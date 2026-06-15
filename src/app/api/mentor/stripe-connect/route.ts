import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/api-auth';

export async function POST(request: Request) {
  const sessionOrResponse = await requireApiRole('mentor');
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  // Connect payouts deferred at launch (platform-only collection; D2). Mentors paid manually.
  // Fast-follow: re-enable via mentor-stripe-connect + this route.
  return NextResponse.json(
    {
      success: false,
      error: 'Stripe Connect payouts are deferred. Mentors are paid manually for now.',
    },
    { status: 503 },
  );
}

