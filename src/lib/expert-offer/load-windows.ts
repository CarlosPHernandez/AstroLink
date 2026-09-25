import 'server-only';

import { supabaseAdmin } from '@/lib/supabase';

/** Buyer-facing rejection when saved hours or offered services block a booking. */
export class ExpertOfferBookingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExpertOfferBookingError';
  }
}

const HOURS_LOAD_FAILED = 'Could not load expert hours.';

type DbError = { message: string };

type MentorZoneRow = { timezone: string | null };

type WindowRow = {
  weekday: number;
  start_minute: number;
  end_minute: number;
};

type QueryResult<T> = { data: T; error: DbError | null };

export async function loadMentorWindows(mentorId: string): Promise<{
  timezone: string | null;
  windows: { weekday: number; startMinute: number; endMinute: number }[];
}> {
  // timezone is not in database.types.ts yet.
  const mentors = supabaseAdmin as unknown as {
    from: (table: 'mentors') => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          single: () => Promise<QueryResult<MentorZoneRow | null>>;
        };
      };
    };
  };
  // mentor_availability_windows is not in database.types.ts yet.
  const windowsTable = supabaseAdmin as unknown as {
    from: (table: 'mentor_availability_windows') => {
      select: (columns: string) => {
        eq: (column: string, value: string) => Promise<QueryResult<WindowRow[] | null>>;
      };
    };
  };

  const zone = await mentors.from('mentors').select('timezone').eq('id', mentorId).single();
  if (zone.error) throw new Error(HOURS_LOAD_FAILED);

  const listed = await windowsTable
    .from('mentor_availability_windows')
    .select('weekday, start_minute, end_minute')
    .eq('mentor_id', mentorId);
  if (listed.error) throw new Error(HOURS_LOAD_FAILED);

  return {
    timezone: zone.data?.timezone ?? null,
    windows: (listed.data ?? []).map((row) => ({
      weekday: row.weekday,
      startMinute: row.start_minute,
      endMinute: row.end_minute,
    })),
  };
}
