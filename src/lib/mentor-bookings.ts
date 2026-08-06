import 'server-only';

import type {
  MentorBookingView,
  MentorPathAssessmentSummary,
} from '@/lib/mentor-booking-partition';
import { supabaseAdmin } from '@/lib/supabase';
import type {
  BookingStatus,
  BriefingPayload,
  ServiceType,
} from '@/lib/types';

export type { MentorBookingView } from '@/lib/mentor-booking-partition';
export {
  getMentorBookingContextSummary,
  partitionMentorBookings,
  isBookingUpcoming,
} from '@/lib/mentor-booking-partition';

function mapPathAssessment(row: {
  first_name?: string | null;
  answers_json?: unknown;
  report_json?: unknown;
} | null): MentorPathAssessmentSummary | null {
  if (!row) return null;
  const answers = (row.answers_json ?? {}) as Record<string, unknown>;
  const report = (row.report_json ?? {}) as Record<string, unknown>;

  const keyGaps = Array.isArray(report.key_gaps)
    ? report.key_gaps
        .filter(
          (g): g is { title: string; detail: string } =>
            !!g &&
            typeof g === 'object' &&
            typeof (g as { title?: unknown }).title === 'string' &&
            typeof (g as { detail?: unknown }).detail === 'string',
        )
        .slice(0, 4)
    : [];

  const nextActions = Array.isArray(report.next_actions)
    ? report.next_actions
        .filter(
          (a): a is { action: string; why: string } =>
            !!a &&
            typeof a === 'object' &&
            typeof (a as { action?: unknown }).action === 'string' &&
            typeof (a as { why?: unknown }).why === 'string',
        )
        .slice(0, 5)
    : [];

  const focusAreas = Array.isArray(report.focus_areas)
    ? report.focus_areas.filter((x): x is string => typeof x === 'string').slice(0, 6)
    : [];

  return {
    firstName:
      (typeof answers.firstName === 'string' && answers.firstName) ||
      row.first_name ||
      '',
    stage: typeof answers.stage === 'string' ? answers.stage : null,
    primaryGoal: typeof answers.primaryGoal === 'string' ? answers.primaryGoal : null,
    network: typeof answers.network === 'string' ? answers.network : null,
    obstacle: typeof answers.obstacle === 'string' ? answers.obstacle : null,
    experience: typeof answers.experience === 'string' ? answers.experience : null,
    headline: typeof report.headline === 'string' ? report.headline : null,
    standingSummary:
      typeof report.standing_summary === 'string' ? report.standing_summary : null,
    focusAreas,
    keyGaps,
    nextActions,
  };
}

export async function listMentorBookings(mentorId: string): Promise<MentorBookingView[]> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(
      'id, service_type, scheduled_at, status, match_reason, daily_room_url, briefing_json, intake_background, duration_minutes, path_assessment_id, users(full_name), path_assessments(first_name, answers_json, report_json)',
    )
    .eq('mentor_id', mentorId)
    .order('scheduled_at', { ascending: false });

  if (error || !data) {
    // Fallback without join if path_assessments not migrated yet
    if (error) {
      console.error('listMentorBookings:', error.message);
      const fallback = await supabaseAdmin
        .from('bookings')
        .select(
          'id, service_type, scheduled_at, status, match_reason, daily_room_url, briefing_json, intake_background, duration_minutes, users(full_name)',
        )
        .eq('mentor_id', mentorId)
        .order('scheduled_at', { ascending: false });
      if (fallback.error || !fallback.data) {
        return [];
      }
      return fallback.data.map((row) => {
        const mentee = row.users as { full_name: string } | null;
        return {
          id: row.id,
          menteeName: mentee?.full_name ?? 'Buyer',
          serviceType: row.service_type as ServiceType,
          scheduledAt: row.scheduled_at,
          status: row.status as BookingStatus,
          matchReason: row.match_reason,
          dailyRoomUrl: row.daily_room_url,
          intakeBackground: row.intake_background,
          briefing: (row.briefing_json as BriefingPayload | null) ?? null,
          durationMinutes: row.duration_minutes ?? undefined,
          pathAssessment: null,
        };
      });
    }
    return [];
  }

  return data.map((row) => {
    const mentee = row.users as { full_name: string } | null;
    const assessmentJoin = row.path_assessments as {
      first_name?: string | null;
      answers_json?: unknown;
      report_json?: unknown;
    } | null;
    return {
      id: row.id,
      menteeName: mentee?.full_name ?? 'Buyer',
      serviceType: row.service_type as ServiceType,
      scheduledAt: row.scheduled_at,
      status: row.status as BookingStatus,
      matchReason: row.match_reason,
      dailyRoomUrl: row.daily_room_url,
      intakeBackground: row.intake_background,
      briefing: (row.briefing_json as BriefingPayload | null) ?? null,
      durationMinutes: row.duration_minutes ?? undefined,
      pathAssessment: mapPathAssessment(assessmentJoin),
    };
  });
}
