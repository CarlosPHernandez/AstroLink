import { createClient } from '@supabase/supabase-js';

export const MENTEE_ID = 'a0000001-0000-4000-8000-000000000001';
export const CHRIS_MENTOR_ID = 'a0000002-0000-4000-8000-000000000002';
/** Canonical seed value from `20260531140100_seed_d1_dev.sql`. */
export const CHRIS_SEED_EMPLOYER = 'Inspiration4 / Lockheed Martin / Starfish Space';
export const E2E_GOALS_PREFIX = 'E2E:';

const E2E_EMPLOYER_SUFFIX = /-e2e-\d+$/;

export function stripE2eEmployerSuffix(employer: string): string {
  return employer.replace(E2E_EMPLOYER_SUFFIX, '');
}

/** Restore Chris mentor employer after profile-save E2E (shared hosted Supabase). */
export async function restoreChrisMentorEmployer(employer: string = CHRIS_SEED_EMPLOYER) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('mentors')
    .update({ employer: stripE2eEmployerSuffix(employer) })
    .eq('id', CHRIS_MENTOR_ID);

  if (error) {
    throw new Error(`E2E cleanup failed to restore Chris employer: ${error.message}`);
  }
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for E2E cleanup');
  }
  return createClient(url, key);
}

/**
 * Remove Carlos bookings whose match_reason starts with `matchReasonPrefix`
 * (transactions first — FK RESTRICT). Use a spec-specific prefix so parallel
 * Playwright workers do not delete each other's bookings.
 */
export async function deleteE2eBookingsForMentee(
  matchReasonPrefix: string = E2E_GOALS_PREFIX,
) {
  const supabase = getSupabaseAdmin();

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('mentee_id', MENTEE_ID)
    .like('match_reason', `${matchReasonPrefix}%`);

  if (error) {
    throw new Error(`E2E cleanup failed to list bookings: ${error.message}`);
  }

  await deleteBookingsByIds(supabase, bookings?.map((row) => row.id) ?? []);
}

async function deleteBookingsByIds(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  ids: string[],
) {
  if (!ids.length) {
    return;
  }

  const { error: txError } = await supabase.from('transactions').delete().in('booking_id', ids);
  if (txError) {
    throw new Error(`E2E cleanup failed to delete transactions: ${txError.message}`);
  }

  const { error: bookingError } = await supabase.from('bookings').delete().in('id', ids);
  if (bookingError) {
    throw new Error(`E2E cleanup failed to delete bookings: ${bookingError.message}`);
  }
}

/** Fake Daily room + in-window schedule so session gate is `ready` without DAILY_API_KEY. */
export async function setE2eDailyRoomStub(bookingId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('bookings')
    .update({
      daily_room_url: `https://e2e.astrolink.test/${bookingId}`,
      scheduled_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  if (error) {
    throw new Error(`E2E failed to set daily room stub: ${error.message}`);
  }
}
