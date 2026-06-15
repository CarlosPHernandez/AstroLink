import { NextResponse } from 'next/server';
import type { Json } from '@/lib/database.types';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import {
  assertBookingCancelRateLimit,
  getBookingClientKey,
  isBookingRateLimitError,
} from '@/lib/booking-rate-limit';
import { computeCancellationRefund } from '@/lib/refunds';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: bookingId } = await params;

  try {
    const session = await getSession();
    if (!session || session.role !== 'mentee') {
      return NextResponse.json({ success: false, error: 'Sign in to cancel your booking.' }, { status: 401 });
    }

    // Rate limit cancels (per user)
    const clientKey = getBookingClientKey(request, session.userId);
    try {
      assertBookingCancelRateLimit(clientKey);
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

    // Load booking and verify ownership
    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .select('id, mentee_id, mentor_id, status, scheduled_at, stripe_payment_intent_id')
      .eq('id', bookingId)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json({ success: false, error: 'Booking not found.' }, { status: 404 });
    }

    if (booking.mentee_id !== session.userId) {
      return NextResponse.json({ success: false, error: 'Not authorized to cancel this booking.' }, { status: 403 });
    }

    const terminal = new Set(['completed', 'cancelled', 'refunded']);
    if (terminal.has(booking.status)) {
      return NextResponse.json({
        success: true,
        data: { bookingId, alreadyProcessed: true, status: booking.status },
      });
    }

    const policy = computeCancellationRefund(booking.scheduled_at);

    let refundId: string | null = null;
    if (policy.refundable && !booking.stripe_payment_intent_id.startsWith('dev_skip_')) {
      // Create refund via Stripe (immediate capture model → refunds the captured charge)
      const refund = await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
        metadata: {
          app: 'astrolink',
          booking_id: booking.id,
        },
      });
      refundId = refund.id;

      // Update tx with refund id + status (idempotency via event later too)
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'refunded', stripe_refund_id: refundId })
        .eq('booking_id', booking.id);
    }

    // Advance booking status
    const nextStatus = refundId ? 'refunded' : 'cancelled';
    await supabaseAdmin
      .from('bookings')
      .update({ status: nextStatus })
      .eq('id', booking.id);

    await supabaseAdmin.from('audit_log').insert({
      agent_id: 'APX-01',
      event: refundId ? 'BOOKING_REFUNDED' : 'BOOKING_CANCELLED',
      ref_id: booking.id,
      payload: {
        refund_id: refundId,
        policy_reason: policy.reason,
        refund_percent: policy.refundPercent,
      } as Json,
    });

    return NextResponse.json({
      success: true,
      data: {
        bookingId: booking.id,
        status: nextStatus,
        refunded: !!refundId,
        refundId,
        policy: policy.reason,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Cancel failed';
    console.error('Booking cancel error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
