import 'server-only';

import {
  isDailyTranscriptionEnabled,
  resolveSessionJoinPhase,
} from '@/lib/daily';
import { isE2eStubLlmEnabled } from '@/lib/llm';
import {
  isSupportedTargetLocale,
  type SupportedTargetLocale,
} from '@/lib/transcript-translation/types';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';
import type { BriefingPayload } from '@/lib/types';

export type SessionParticipantRole = 'mentee' | 'mentor' | 'admin';

export type SessionGate =
  | 'ready'
  | 'too_early'
  | 'expired'
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
  viewerId: string;
  viewerName: string;
  dailyRoomUrl: string | null;
  mentorName: string;
  menteeName: string;
  mentorId: string;
  menteeId: string;
  menteePreferredLocale: SupportedTargetLocale;
  captionsAvailable: boolean;
  showCaptionsForBuyer: boolean;
  /** Dev/E2E: skip Daily WebRTC; inject transcription via window.__ASTROLINK_E2E_CAPTIONS__ */
  e2eCaptionsStub: boolean;
  scheduledAt: string;
  /** Booked call length; drives Daily eject_after_elapsed on join tokens. */
  durationMinutes: number | null;
  briefing: BriefingPayload | null;
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

export function resolveSessionGate(params: {
  status: string;
  dailyRoomUrl: string | null;
  scheduledAt: string | null;
  durationMinutes?: number | null;
  nowMs?: number;
}): SessionGate {
  const {
    status,
    dailyRoomUrl,
    scheduledAt,
    durationMinutes = null,
    nowMs = Date.now(),
  } = params;

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
    if (!dailyRoomUrl) {
      return 'provisioning';
    }

    const joinPhase = resolveSessionJoinPhase(scheduledAt, nowMs, { durationMinutes });
    if (joinPhase === 'too_early') {
      return 'too_early';
    }
    if (joinPhase === 'expired') {
      return 'expired';
    }
    return 'ready';
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
      'id, status, daily_room_url, mentee_id, mentor_id, scheduled_at, duration_minutes, briefing_json, mentors(full_name), users!bookings_mentee_id_fkey(full_name, preferred_locale)',
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
  const durationMinutes =
    typeof data.duration_minutes === 'number' && Number.isFinite(data.duration_minutes)
      ? data.duration_minutes
      : null;

  const gate = resolveSessionGate({
    status: data.status,
    dailyRoomUrl: data.daily_room_url,
    scheduledAt: data.scheduled_at,
    durationMinutes,
  });

  const menteeUser = data.users as { full_name: string; preferred_locale: string | null } | null;
  const menteePreferredLocale: SupportedTargetLocale =
    menteeUser?.preferred_locale && isSupportedTargetLocale(menteeUser.preferred_locale)
      ? menteeUser.preferred_locale
      : 'en';

  const e2eCaptionsStub = isE2eStubLlmEnabled();

  const captionsAvailable =
    gate === 'ready' && (isDailyTranscriptionEnabled() || e2eCaptionsStub);
  const showCaptionsForBuyer = captionsAvailable;

  return {
    booking: {
      id: data.id,
      status: data.status,
      gate,
      sessionRole,
      viewerId: session.userId,
      viewerName: session.fullName,
      dailyRoomUrl: data.daily_room_url,
      mentorName: mentor?.full_name ?? 'Expert',
      menteeName: menteeUser?.full_name ?? 'Guest',
      mentorId: data.mentor_id,
      menteeId: data.mentee_id,
      menteePreferredLocale,
      captionsAvailable,
      showCaptionsForBuyer,
      e2eCaptionsStub,
      scheduledAt: data.scheduled_at,
      durationMinutes,
      briefing: (data.briefing_json as BriefingPayload | null) ?? null,
    },
    forbidden: false,
  };
}
