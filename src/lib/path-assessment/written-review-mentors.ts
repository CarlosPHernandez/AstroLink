import 'server-only';

import { supabaseAdmin } from '@/lib/supabase';

/** Count listed, approved mentors who accept written report reviews. */
export async function countWrittenReviewMentors(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('mentors')
    .select('id', { count: 'exact', head: true })
    .eq('compliance_status', 'approved')
    .eq('is_listed', true)
    .eq('written_report_reviews_enabled', true);

  if (error) {
    console.warn('[path-assessment] countWrittenReviewMentors', error.message);
    return 0;
  }
  return count ?? 0;
}
