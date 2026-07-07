import 'server-only';

import type { Json } from '@/lib/database.types';
import {
  buildMenteeConfirmationEmail,
  buildMentorConfirmationEmail,
  type BookingEmailContext,
} from '@/lib/email/booking-confirmed-templates';
import { isNotificationsDisabled } from '@/lib/email/notification-env';
import { sendEmail, type EmailSender } from '@/lib/email/resend-client';
import { supabaseAdmin } from '@/lib/supabase';
import type { ServiceType } from '@/lib/types';

type RecipientRole = 'mentee' | 'mentor';

type BookingRow = {
  id: string;
  scheduled_at: string;
  service_type: ServiceType;
  match_reason: string | null;
  briefing_json: unknown;
  daily_room_url: string | null;
  campaign_id?: string | null;
  duration_minutes?: number | null;
  users: { full_name: string; email: string } | null;
  mentors: { full_name: string; email: string } | null;
};

export class NotificationAgent {
  private agentId = 'APX-08' as const;

  constructor(private readonly emailSender: EmailSender = sendEmail) {}

  /** Sends mentee + mentor confirmation emails. Never throws — booking fulfillment must continue. */
  async sendBookingConfirmations(bookingId: string): Promise<void> {
    if (isNotificationsDisabled()) {
      await this.logAudit('NOTIFICATION_SKIPPED', bookingId, { reason: 'disabled' });
      return;
    }

    try {
      const ctx = await this.loadBookingContext(bookingId);
      if (!ctx) {
        await this.logAudit('NOTIFICATION_SKIPPED', bookingId, { reason: 'booking_not_found' });
        return;
      }

      await this.sendForRole(ctx, 'mentee');
      await this.sendForRole(ctx, 'mentor');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Notification agent failed';
      await this.logAudit('NOTIFICATION_FAILED', bookingId, { error: message, scope: 'agent' });
    }
  }

  private async loadBookingContext(bookingId: string): Promise<BookingEmailContext | null> {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select(
        'id, scheduled_at, service_type, match_reason, briefing_json, daily_room_url, campaign_id, duration_minutes, users(full_name, email), mentors(full_name, email)',
      )
      .eq('id', bookingId)
      .single();

    if (error || !data) {
      return null;
    }

    const row = data as unknown as BookingRow;
    const mentee = row.users;
    const mentor = row.mentors;

    if (!mentee || !mentor) {
      return null;
    }

    return {
      bookingId: row.id,
      scheduledAt: row.scheduled_at,
      serviceType: row.service_type,
      matchReason: row.match_reason,
      briefingJson: row.briefing_json,
      dailyRoomUrl: row.daily_room_url,
      campaignId: row.campaign_id ?? null,
      durationMinutes: row.duration_minutes ?? null,
      menteeName: mentee.full_name,
      menteeEmail: mentee.email,
      mentorName: mentor.full_name,
      mentorEmail: mentor.email,
    };
  }

  private async sendForRole(ctx: BookingEmailContext, role: RecipientRole): Promise<void> {
    const existing = await this.getExistingDelivery(ctx.bookingId, role);
    if (existing) {
      return;
    }

    const email = role === 'mentee' ? ctx.menteeEmail.trim() : ctx.mentorEmail.trim();
    if (!email) {
      await this.recordDelivery({
        bookingId: ctx.bookingId,
        role,
        status: 'skipped',
        errorMessage: 'missing_email',
      });
      await this.logAudit('NOTIFICATION_SKIPPED', ctx.bookingId, { role, reason: 'missing_email' });
      return;
    }

    const built =
      role === 'mentee'
        ? buildMenteeConfirmationEmail(ctx)
        : buildMentorConfirmationEmail(ctx);

    const result = await this.emailSender({
      to: email,
      subject: built.subject,
      html: built.html,
      attachments: built.attachment ? [built.attachment] : undefined,
    });

    if ('skipped' in result) {
      await this.logAudit('NOTIFICATION_SKIPPED', ctx.bookingId, {
        role,
        reason: result.reason,
      });
      return;
    }

    if (!result.ok) {
      await this.recordDelivery({
        bookingId: ctx.bookingId,
        role,
        status: 'failed',
        errorMessage: result.error,
      });
      await this.logAudit('NOTIFICATION_FAILED', ctx.bookingId, { role, error: result.error });
      return;
    }

    await this.recordDelivery({
      bookingId: ctx.bookingId,
      role,
      status: 'sent',
      resendMessageId: result.messageId,
    });
    await this.logAudit('NOTIFICATION_SENT', ctx.bookingId, {
      role,
      resend_message_id: result.messageId,
    });
  }

  private async getExistingDelivery(bookingId: string, role: RecipientRole) {
    const { data } = await supabaseAdmin
      .from('notification_deliveries')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('channel', 'email')
      .eq('recipient_role', role)
      .maybeSingle();

    return data;
  }

  private async recordDelivery(params: {
    bookingId: string;
    role: RecipientRole;
    status: 'sent' | 'failed' | 'skipped';
    resendMessageId?: string;
    errorMessage?: string;
  }) {
    const { error } = await supabaseAdmin.from('notification_deliveries').insert({
      booking_id: params.bookingId,
      channel: 'email',
      recipient_role: params.role,
      status: params.status,
      resend_message_id: params.resendMessageId ?? null,
      error_message: params.errorMessage ?? null,
    });

    if (error && error.code !== '23505') {
      console.error('notification_deliveries insert failed:', error.message);
    }
  }

  private async logAudit(event: string, refId: string | null, payload: Record<string, unknown>) {
    await supabaseAdmin.from('audit_log').insert({
      agent_id: this.agentId,
      event,
      ref_id: refId,
      payload: payload as Json,
    });
  }
}
