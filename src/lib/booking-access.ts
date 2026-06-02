import 'server-only';

import { buildAuthorizedDailyJoinUrl } from '@/lib/daily';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';
import type { MentorBriefingOutput, PreCallBriefOutput } from '@/lib/types';

export type SessionParticipantRole = 'mentee' | 'mentor' | 'admin';

export type SessionGate =
  | 'ready'
  | 'pending_payment'
  | 'provisioning'
  | 'completed'
  | 'payment_failed'
  | 'unavailable';

export interface BookingSessionView {
  id: string;
  status: string;
  gate: SessionGate;
  sessionRole: SessionParticipantRole;
  dailyRoomUrl: string | null;
  dailyJoinUrl: string | null;
  mentorName: string;
  scheduledAt: string;
  briefing: MentorBriefingOutput | PreCallBriefOutput | null;
  tokenError: string | null;
}

function resolveSessionRole(params: {
  userId: string;
  menteeId: string;
  mentorId: string;
  admin: boolean;
}): SessionParticipantRole | null {
  if (params.admin) {
    return 'admin';
  }
  if (params.userId === params.menteeId) {
    return 'mentee';
  }
  if (params.userId === params.mentorId) {
    return 'mentor';
  }
  return null;
}

function resolveGate(status: string, dailyRoomUrl: string | null): SessionGate {
  if (status === 'pending_payment') {
    return 'pending_payment';
  }
  if (status === 'payment_failed') {
    return 'payment_failed';
  }
  if (status === 'completed') {
    return 'completed';
  }
  if (status === 'confirmed') {
    return dailyRoomUrl ? 'ready' : 'provisioning';
  }
  return 'unavailable';
}

export async function getBookingForSession(
  bookingId: string,
): Promise<{ booking: BookingSessionView | null; forbidden: boolean }> {
  const session = await getSession();
  if (!session) {
    return { booking: null, forbidden: true };
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(
      'id, status, daily_room_url, mentee_id, mentor_id, scheduled_at, briefing_json, mentors(full_name)',
    )
    .eq('id', bookingId)
    .single();

  if (error || !data) {
    return { booking: null, forbidden: false };
  }

  const sessionRole = resolveSessionRole({
    userId: session.userId,
    menteeId: data.mentee_id,
    mentorId: data.mentor_id,
    admin: session.role === 'admin',
  });

  if (!sessionRole) {
    return { booking: null, forbidden: true };
  }

  const mentor = data.mentors as { full_name: string } | null;
  const gate = resolveGate(data.status, data.daily_room_url);

  let dailyJoinUrl: string | null = null;
  let tokenError: string | null = null;

  if (gate === 'ready' && data.daily_room_url && process.env.DAILY_API_KEY) {
    try {
      dailyJoinUrl = await buildAuthorizedDailyJoinUrl({
        roomUrl: data.daily_room_url,
        userId: session.userId,
        userName: session.fullName,
        isOwner: sessionRole === 'mentor' || sessionRole === 'admin',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Meeting token failed';
      tokenError = message;
      console.error('[session] meeting token mint failed', { bookingId, message });
    }
  }

  return {
    booking: {
      id: data.id,
      status: data.status,
      gate,
      sessionRole,
      dailyRoomUrl: data.daily_room_url,
      dailyJoinUrl,
      mentorName: mentor?.full_name ?? 'Expert',
      scheduledAt: data.scheduled_at,
      briefing: (data.briefing_json as MentorBriefingOutput | PreCallBriefOutput | null) ?? null,
      tokenError,
    },
    forbidden: false,
  };
}
