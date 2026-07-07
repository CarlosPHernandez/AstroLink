import { NextResponse } from 'next/server';
import type { Json } from '@/lib/database.types';
import {
  releaseChrisCampaignSlot,
  shouldReleaseChrisCampaignSlotForStatus,
} from '@/lib/chris-campaign/chris-campaign-slots';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import {
  assertBookingCancelRateLimit,
  getBookingClientKey,
  isBookingRateLimitError,
} from '@/lib/booking-rate-limit';
import { computeCancellationRefund } from '@/lib/refunds';

/** Includes campaign_id once 20260627120000_booking_campaigns.sql is applied (types lag migration). */
type BookingCancelRow = {
  id: string;
  mentee_id: string;
  mentor_id: string;
  status: string;
  scheduled_at: string;
  stripe_payment_intent_id: string;
  campaign_id?: string | null;
};

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
    const { data: bookingData, error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    const booking = bookingData as BookingCancelRow | null;

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

    const campaignId = booking.campaign_id;
    const releaseCampaignSlot = shouldReleaseChrisCampaignSlotForStatus(
      booking.status,
      campaignId,
    );

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

    if (releaseCampaignSlot && campaignId) {
      await releaseChrisCampaignSlot(campaignId);
      await supabaseAdmin.from('audit_log').insert({
        agent_id: 'APX-01',
        event: 'CHRIS_CAMPAIGN_SLOT_RELEASED',
        ref_id: booking.id,
        payload: {
          campaign_id: campaignId,
          previous_status: booking.status,
          reason: refundId ? 'booking_refunded' : 'booking_cancelled',
        } as Json,
      });
    }

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
