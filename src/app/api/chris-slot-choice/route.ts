import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  findSlotByStartUtc,
  generateSlotsForBlocks,
} from '@/lib/chris-campaign/chris-availability-slots';
import { getChrisCampaignId } from '@/lib/chris-campaign/chris-campaign-config';
import { CHRIS_SESSION_DURATION_MINUTES } from '@/lib/chris-campaign/chris-campaign-constants';
import { verifyChrisSlotToken } from '@/lib/chris-campaign/chris-slot-choice-token';
import { extractDailyRoomNameFromUrl, updateDailyRoomSchedule } from '@/lib/daily';
import { sendEmail } from '@/lib/email/resend-client';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';
import type { BookingStatus } from '@/lib/types';

export const CHRIS_SLOT_OPS_NOTIFY_EMAIL = 'support@astro-link.space';

const BodySchema = z.object({
  token: z.string().min(10),
  startUtcIso: z.string().datetime({ offset: true }),
});

const ELIGIBLE: ReadonlySet<BookingStatus> = new Set([
  'confirmed',
  'pending_payment',
]);

type BookingRow = {
  id: string;
  status: BookingStatus;
  scheduled_at: string;
  mentee_id: string;
  campaign_id: string | null;
  duration_minutes: number | null;
  daily_room_url: string | null;
  users: { email: string; full_name: string | null } | null;
};

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 },
    );
  }

  const verified = verifyChrisSlotToken(parsed.data.token);
  if (!verified.ok) {
    const status = verified.reason === 'expired' ? 410 : 401;
    return NextResponse.json(
      {
        success: false,
        error:
          verified.reason === 'expired'
            ? 'This link has expired. Reply to your email and we will send a new one.'
            : 'Invalid or expired link.',
      },
      { status },
    );
  }

  const { payload } = verified;
  const slots = generateSlotsForBlocks(payload.blocks, CHRIS_SESSION_DURATION_MINUTES);
  const slot = findSlotByStartUtc(slots, parsed.data.startUtcIso);
  if (!slot) {
    return NextResponse.json(
      { success: false, error: 'That time is not available. Please pick another slot.' },
      { status: 400 },
    );
  }

  // Reschedule of an existing hold: reject past starts only (do not re-apply new-booking 2-day lead).
  if (new Date(slot.startUtcIso).getTime() < Date.now()) {
    return NextResponse.json(
      { success: false, error: 'That time has already passed. Please pick another slot.' },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(
      'id, status, scheduled_at, mentee_id, campaign_id, duration_minutes, daily_room_url, users(email, full_name)',
    )
    .eq('id', payload.bookingId)
    .single();

  const booking = data as BookingRow | null;
  if (error || !booking) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
  }

  if (booking.campaign_id !== getChrisCampaignId()) {
    return NextResponse.json(
      { success: false, error: 'This booking is not a Chris session.' },
      { status: 400 },
    );
  }

  if (!ELIGIBLE.has(booking.status)) {
    return NextResponse.json(
      {
        success: false,
        error: 'This booking can no longer be rescheduled from this link.',
      },
      { status: 409 },
    );
  }

  const menteeEmail = booking.users?.email?.trim().toLowerCase() ?? '';
  if (menteeEmail && menteeEmail !== payload.email.toLowerCase()) {
    return NextResponse.json(
      { success: false, error: 'This link does not match the booking email.' },
      { status: 403 },
    );
  }

  // Optional: if signed in, must be the mentee (admins can use token path only).
  const session = await getSession();
  if (session && session.role === 'mentee' && session.userId !== booking.mentee_id) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const previousScheduledAt = booking.scheduled_at;
  const durationMinutes = booking.duration_minutes ?? CHRIS_SESSION_DURATION_MINUTES;
  const { error: updateError } = await supabaseAdmin
    .from('bookings')
    .update({
      scheduled_at: slot.startUtcIso,
    })
    .eq('id', booking.id);

  if (updateError) {
    console.error('[chris-slot-choice] update failed', {
      bookingId: booking.id,
      message: updateError.message,
    });
    return NextResponse.json(
      { success: false, error: 'Could not save your time. Please try again.' },
      { status: 500 },
    );
  }

  if (previousScheduledAt !== slot.startUtcIso && booking.daily_room_url) {
    const roomName = extractDailyRoomNameFromUrl(booking.daily_room_url);
    if (roomName) {
      try {
        await updateDailyRoomSchedule({
          roomName,
          scheduledAt: slot.startUtcIso,
          durationMinutes,
        });
      } catch (error) {
        console.error('[chris-slot-choice] Daily room update failed', {
          bookingId: booking.id,
          error,
        });
      }
    }
  }

  const opsSubject = `[Chris slot] ${menteeEmail || payload.email} → ${slot.label}`;
  const opsHtml = `
    <p><strong>Chris session time chosen</strong></p>
    <ul>
      <li>Booking: <code>${booking.id}</code></li>
      <li>Mentee: ${escapeHtml(menteeEmail || payload.email)}</li>
      <li>Name: ${escapeHtml(booking.users?.full_name ?? '—')}</li>
      <li>Previous: ${escapeHtml(previousScheduledAt)}</li>
      <li>New: ${escapeHtml(slot.startUtcIso)} (${escapeHtml(slot.label)})</li>
      <li>Duration: ${CHRIS_SESSION_DURATION_MINUTES} minutes</li>
      <li>Status: ${escapeHtml(booking.status)}</li>
    </ul>
  `.trim();

  const notify = await sendEmail({
    to: CHRIS_SLOT_OPS_NOTIFY_EMAIL,
    subject: opsSubject,
    html: opsHtml,
  });
  if ('ok' in notify && notify.ok === false) {
    console.error('[chris-slot-choice] ops notify failed', notify.error);
  } else if ('skipped' in notify && notify.skipped) {
    console.warn('[chris-slot-choice] ops notify skipped', notify.reason);
  }

  return NextResponse.json({
    success: true,
    data: {
      bookingId: booking.id,
      scheduledAt: slot.startUtcIso,
      endAt: slot.endUtcIso,
      label: slot.label,
      timeRangeLabel: slot.timeRangeLabel,
      durationMinutes: CHRIS_SESSION_DURATION_MINUTES,
    },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
