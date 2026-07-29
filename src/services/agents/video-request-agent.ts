import 'server-only';

import {
  createDevSkippedPaymentIntentId,
  isStripePaymentsSkipped,
} from '@/lib/booking-payments';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import {
  sendMentorNewVideoRequestEmail,
  sendVideoRequestConfirmationEmail,
  sendVideoRequestDeliveredEmail,
  sendVideoRequestRefundEmail,
} from '@/lib/video-requests/emails';
import { canTransitionVideoRequest, computeVideoDueAt } from '@/lib/video-requests/state';
import {
  isVideoRequestOccasion,
  normalizeBuyerEmail,
  type VideoRequestOccasion,
  type VideoRequestRow,
  type VideoRequestStatus,
} from '@/lib/video-requests/types';

type MentorOfferRow = {
  id: string;
  full_name: string;
  email: string;
  slug: string | null;
  compliance_status: string;
  is_listed: boolean;
  video_requests_enabled: boolean;
  video_request_price_cents: number;
  video_request_sla_days: number;
};

function asVideoRequest(row: unknown): VideoRequestRow {
  return row as VideoRequestRow;
}

export class VideoRequestAgent {
  async createGuestRequest(params: {
    mentorSlug: string;
    buyerEmail: string;
    fromName: string;
    recipientName?: string | null;
    occasion: string;
    instructions: string;
    pronunciationNotes?: string | null;
    marketingReferrer?: string | null;
  }): Promise<{
    videoRequestId: string;
    clientSecret: string | null;
    amountCents: number;
    paymentIntentId: string;
    skipStripe: boolean;
  }> {
    const email = normalizeBuyerEmail(params.buyerEmail);
    if (!email.includes('@') || email.length < 5) {
      throw new Error('A valid email is required.');
    }
    if (!isVideoRequestOccasion(params.occasion)) {
      throw new Error('Invalid occasion.');
    }
    const instructions = params.instructions.trim();
    if (instructions.length < 12 || instructions.length > 1200) {
      throw new Error('Instructions must be between 12 and 1200 characters.');
    }
    const fromName = params.fromName.trim().slice(0, 120);
    if (!fromName) {
      throw new Error('Your name is required.');
    }

    const { data: mentor, error: mentorErr } = await supabaseAdmin
      .from('mentors')
      .select(
        'id, full_name, email, slug, compliance_status, is_listed, video_requests_enabled, video_request_price_cents, video_request_sla_days',
      )
      .eq('slug', params.mentorSlug)
      .maybeSingle();

    if (mentorErr || !mentor) {
      throw new Error('Expert not found.');
    }
    const m = mentor as MentorOfferRow;
    if (m.compliance_status !== 'approved' || !m.is_listed) {
      throw new Error('This expert is not available.');
    }
    if (!m.video_requests_enabled || m.video_request_price_cents <= 0) {
      throw new Error('Personal video is not available for this expert.');
    }

    const priceCents = m.video_request_price_cents;
    const skipStripe = isStripePaymentsSkipped();
    let paymentIntentId: string;
    let clientSecret: string | null = null;

    if (skipStripe) {
      paymentIntentId = createDevSkippedPaymentIntentId();
    } else {
      const pi = await stripe.paymentIntents.create({
        amount: priceCents,
        currency: 'usd',
        receipt_email: email,
        automatic_payment_methods: { enabled: true },
        metadata: {
          app: 'astrolink',
          product: 'personalized_video',
          mentor_id: m.id,
          buyer_email: email,
        },
      });
      paymentIntentId = pi.id;
      clientSecret = pi.client_secret;
    }

    const { data: created, error: insertErr } = await supabaseAdmin
      .from('video_requests')
      .insert({
        mentor_id: m.id,
        buyer_email: email,
        status: 'pending_payment',
        price_cents: priceCents,
        stripe_payment_intent_id: paymentIntentId,
        occasion: params.occasion as VideoRequestOccasion,
        recipient_name: params.recipientName?.trim() || null,
        from_name: fromName,
        instructions,
        pronunciation_notes: params.pronunciationNotes?.trim() || null,
        marketing_referrer: params.marketingReferrer?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertErr || !created) {
      throw new Error(insertErr?.message ?? 'Could not create video request.');
    }

    // Attach video_request_id to PI metadata when using Stripe (best-effort update)
    if (!skipStripe) {
      try {
        await stripe.paymentIntents.update(paymentIntentId, {
          metadata: {
            app: 'astrolink',
            product: 'personalized_video',
            mentor_id: m.id,
            buyer_email: email,
            video_request_id: created.id as string,
          },
        });
      } catch (err) {
        console.warn('[video-request] failed to update PI metadata', err);
      }
    }

    if (skipStripe) {
      await this.markPaid({
        paymentIntentId,
        videoRequestId: created.id as string,
      });
    }

    return {
      videoRequestId: created.id as string,
      clientSecret,
      amountCents: priceCents,
      paymentIntentId,
      skipStripe,
    };
  }

  async markPaid(params: {
    paymentIntentId: string;
    videoRequestId?: string;
  }): Promise<{ videoRequestId: string; alreadyProcessed: boolean }> {
    let query = supabaseAdmin.from('video_requests').select('*');
    if (params.videoRequestId) {
      query = query.eq('id', params.videoRequestId);
    } else {
      query = query.eq('stripe_payment_intent_id', params.paymentIntentId);
    }
    const { data: row, error } = await query.maybeSingle();
    if (error || !row) {
      throw new Error('Video request not found for payment.');
    }
    const vr = asVideoRequest(row);
    if (vr.status !== 'pending_payment') {
      return { videoRequestId: vr.id, alreadyProcessed: true };
    }
    if (!canTransitionVideoRequest(vr.status, 'paid_awaiting_expert')) {
      throw new Error(`Cannot mark paid from status ${vr.status}`);
    }

    const { data: mentor } = await supabaseAdmin
      .from('mentors')
      .select('full_name, email, video_request_sla_days')
      .eq('id', vr.mentor_id)
      .single();

    const slaDays = (mentor as { video_request_sla_days?: number } | null)?.video_request_sla_days ?? 7;
    const paidAt = new Date();
    const dueAt = computeVideoDueAt(paidAt, slaDays);

    const { error: upErr } = await supabaseAdmin
      .from('video_requests')
      .update({
        status: 'paid_awaiting_expert' satisfies VideoRequestStatus,
        paid_at: paidAt.toISOString(),
        due_at: dueAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', vr.id)
      .eq('status', 'pending_payment');

    if (upErr) {
      throw new Error(upErr.message);
    }

    const expertName = (mentor as { full_name?: string } | null)?.full_name ?? 'your expert';
    const mentorEmail = (mentor as { email?: string } | null)?.email;

    await sendVideoRequestConfirmationEmail({
      buyerEmail: vr.buyer_email,
      expertName,
      priceCents: vr.price_cents,
      dueAt: dueAt.toISOString(),
      occasion: vr.occasion,
    });

    if (mentorEmail) {
      await sendMentorNewVideoRequestEmail({
        mentorEmail,
        fromName: vr.from_name,
        occasion: vr.occasion,
        dueAt: dueAt.toISOString(),
      });
    }

    return { videoRequestId: vr.id, alreadyProcessed: false };
  }

  async deliver(params: {
    videoRequestId: string;
    mentorId: string;
    storagePath: string;
    durationSeconds?: number | null;
  }): Promise<void> {
    const { data: row, error } = await supabaseAdmin
      .from('video_requests')
      .select('*')
      .eq('id', params.videoRequestId)
      .eq('mentor_id', params.mentorId)
      .maybeSingle();

    if (error || !row) {
      throw new Error('Video request not found.');
    }
    const vr = asVideoRequest(row);
    if (vr.status !== 'paid_awaiting_expert') {
      throw new Error(`Cannot deliver from status ${vr.status}`);
    }
    if (!params.storagePath.startsWith(`${params.mentorId}/`)) {
      throw new Error('Invalid storage path.');
    }

    // Verify object exists when storage is configured
    const pathParts = params.storagePath.split('/');
    const fileName = pathParts.pop();
    const folder = pathParts.join('/');
    if (fileName) {
      const { data: listed } = await supabaseAdmin.storage
        .from('personalized-videos')
        .list(folder, { search: fileName });
      const found = (listed ?? []).some((f) => f.name === fileName);
      if (!found && process.env.NODE_ENV === 'production') {
        throw new Error('Uploaded video not found in storage.');
      }
    }

    const { error: upErr } = await supabaseAdmin
      .from('video_requests')
      .update({
        status: 'delivered' satisfies VideoRequestStatus,
        delivered_at: new Date().toISOString(),
        video_storage_path: params.storagePath,
        video_duration_seconds: params.durationSeconds ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vr.id)
      .eq('status', 'paid_awaiting_expert');

    if (upErr) {
      throw new Error(upErr.message);
    }

    const { data: mentor } = await supabaseAdmin
      .from('mentors')
      .select('full_name')
      .eq('id', vr.mentor_id)
      .single();

    await sendVideoRequestDeliveredEmail({
      buyerEmail: vr.buyer_email,
      expertName: (mentor as { full_name?: string } | null)?.full_name ?? 'your expert',
      videoRequestId: vr.id,
    });
  }

  async decline(params: {
    videoRequestId: string;
    mentorId: string;
    reason: string;
  }): Promise<void> {
    const reason = params.reason.trim().slice(0, 500);
    if (reason.length < 3) {
      throw new Error('A decline reason is required.');
    }

    const { data: row, error } = await supabaseAdmin
      .from('video_requests')
      .select('*')
      .eq('id', params.videoRequestId)
      .eq('mentor_id', params.mentorId)
      .maybeSingle();

    if (error || !row) {
      throw new Error('Video request not found.');
    }
    const vr = asVideoRequest(row);
    if (vr.status !== 'paid_awaiting_expert') {
      throw new Error(`Cannot decline from status ${vr.status}`);
    }

    await supabaseAdmin
      .from('video_requests')
      .update({
        status: 'declined' satisfies VideoRequestStatus,
        declined_at: new Date().toISOString(),
        decline_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vr.id);

    await this.refundPayment(vr, 'declined');
  }

  async expireOverdue(now = new Date()): Promise<number> {
    const { data: rows, error } = await supabaseAdmin
      .from('video_requests')
      .select('*')
      .eq('status', 'paid_awaiting_expert')
      .lt('due_at', now.toISOString())
      .limit(50);

    if (error || !rows?.length) {
      return 0;
    }

    let count = 0;
    for (const row of rows) {
      const vr = asVideoRequest(row);
      await supabaseAdmin
        .from('video_requests')
        .update({
          status: 'expired' satisfies VideoRequestStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vr.id)
        .eq('status', 'paid_awaiting_expert');
      try {
        await this.refundPayment(vr, 'expired');
        count += 1;
      } catch (err) {
        console.error('[video-request] expire refund failed', vr.id, err);
      }
    }
    return count;
  }

  private async refundPayment(
    vr: VideoRequestRow,
    reason: 'declined' | 'expired',
  ): Promise<void> {
    if (
      !isStripePaymentsSkipped() &&
      !vr.stripe_payment_intent_id.startsWith('dev_skip_') &&
      !vr.stripe_payment_intent_id.startsWith('free_session_')
    ) {
      try {
        await stripe.refunds.create({
          payment_intent: vr.stripe_payment_intent_id,
          reason: 'requested_by_customer',
        });
      } catch (err) {
        // Already refunded or PI missing — still mark refunded locally
        console.warn('[video-request] stripe refund', err);
      }
    }

    await supabaseAdmin
      .from('video_requests')
      .update({
        status: 'refunded' satisfies VideoRequestStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vr.id);

    const { data: mentor } = await supabaseAdmin
      .from('mentors')
      .select('full_name')
      .eq('id', vr.mentor_id)
      .single();

    await sendVideoRequestRefundEmail({
      buyerEmail: vr.buyer_email,
      expertName: (mentor as { full_name?: string } | null)?.full_name ?? 'your expert',
      reason,
    });
  }

  async createUploadUrl(params: {
    videoRequestId: string;
    mentorId: string;
    contentType: string;
  }): Promise<{ path: string; token: string; signedUrl: string }> {
    const allowed = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (!allowed.includes(params.contentType)) {
      throw new Error('Unsupported video type. Use mp4, mov, or webm.');
    }
    const { data: row, error } = await supabaseAdmin
      .from('video_requests')
      .select('id, mentor_id, status')
      .eq('id', params.videoRequestId)
      .eq('mentor_id', params.mentorId)
      .maybeSingle();
    if (error || !row) {
      throw new Error('Video request not found.');
    }
    if ((row as { status: string }).status !== 'paid_awaiting_expert') {
      throw new Error('This request is not open for delivery.');
    }
    const ext =
      params.contentType === 'video/webm'
        ? 'webm'
        : params.contentType === 'video/quicktime'
          ? 'mov'
          : 'mp4';
    const path = `${params.mentorId}/${params.videoRequestId}/delivery.${ext}`;
    const { data, error: signErr } = await supabaseAdmin.storage
      .from('personalized-videos')
      .createSignedUploadUrl(path);
    if (signErr || !data) {
      throw new Error(signErr?.message ?? 'Could not create upload URL.');
    }
    return { path, token: data.token, signedUrl: data.signedUrl };
  }

  async createWatchMediaUrl(params: {
    videoRequestId: string;
  }): Promise<string | null> {
    const { data: row } = await supabaseAdmin
      .from('video_requests')
      .select('status, video_storage_path')
      .eq('id', params.videoRequestId)
      .maybeSingle();
    if (!row || (row as { status: string }).status !== 'delivered') {
      return null;
    }
    const path = (row as { video_storage_path: string | null }).video_storage_path;
    if (!path) return null;
    const { data, error } = await supabaseAdmin.storage
      .from('personalized-videos')
      .createSignedUrl(path, 60 * 15);
    if (error || !data?.signedUrl) {
      console.error('[video-request] signed media url', error?.message);
      return null;
    }
    return data.signedUrl;
  }
}
