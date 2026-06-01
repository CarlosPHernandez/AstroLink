import { createClient } from '@supabase/supabase-js';

export const MENTEE_ID = 'a0000001-0000-4000-8000-000000000001';
export const E2E_GOALS_PREFIX = 'E2E:';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for E2E cleanup');
  }
  return createClient(url, key);
}

/** Remove Carlos bookings tagged with the E2E goals prefix (transactions first — FK RESTRICT). */
export async function deleteE2eBookingsForMentee() {
  const supabase = getSupabaseAdmin();

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('mentee_id', MENTEE_ID)
    .like('match_reason', `${E2E_GOALS_PREFIX}%`);

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
