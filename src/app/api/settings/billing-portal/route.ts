import { NextResponse } from 'next/server';
import { isStripePaymentsSkipped } from '@/lib/booking-payments';
import { createMenteeBillingPortalSession } from '@/lib/stripe-customer';
import { getSession } from '@/lib/session';

/**
 * POST /api/settings/billing-portal — Stripe Customer Billing Portal for mentees.
 */
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'mentee') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  if (isStripePaymentsSkipped()) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Stripe payments are skipped in this environment (SKIP_STRIPE_PAYMENTS=true). Billing portal is unavailable.',
      },
      { status: 503 },
    );
  }

  try {
    const url = await createMenteeBillingPortalSession(session.userId);
    return NextResponse.json({ success: true, url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not open billing portal';
    console.error('billing-portal:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
