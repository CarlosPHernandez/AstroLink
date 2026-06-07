import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/api-auth';
import { isStripePaymentsSkipped } from '@/lib/booking-payments';
import {
  createMentorExpressDashboardLink,
  createMentorOnboardingLink,
  getMentorStripeRow,
} from '@/lib/mentor-stripe-connect';

export async function POST(request: Request) {
  const sessionOrResponse = await requireApiRole('mentor');
  if (sessionOrResponse instanceof NextResponse) {
    return sessionOrResponse;
  }

  if (isStripePaymentsSkipped()) {
    return NextResponse.json({
      success: true,
      data: {
        mode: 'dev_skip',
        message:
          'Stripe is disabled (SKIP_STRIPE_PAYMENTS). Connect onboarding is not required in this environment.',
      },
    });
  }

  let action: 'onboard' | 'dashboard' = 'onboard';
  try {
    const body = (await request.json()) as { action?: string };
    if (body.action === 'dashboard') {
      action = 'dashboard';
    }
  } catch {
    // Default to onboard when body is empty.
  }

  try {
    const mentor = await getMentorStripeRow(sessionOrResponse.userId);
    if (!mentor) {
      return NextResponse.json(
        { success: false, error: 'Complete your mentor profile before connecting payouts.' },
        { status: 400 },
      );
    }

    if (action === 'dashboard') {
      const url = await createMentorExpressDashboardLink(sessionOrResponse.userId);
      if (!url) {
        return NextResponse.json(
          { success: false, error: 'Connect a bank account before opening the Stripe dashboard.' },
          { status: 400 },
        );
      }
      return NextResponse.json({ success: true, data: { mode: 'dashboard', url } });
    }

    const { url, accountId } = await createMentorOnboardingLink(sessionOrResponse.userId);
    return NextResponse.json({
      success: true,
      data: {
        mode: 'onboard',
        url,
        accountId,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Stripe Connect request failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
