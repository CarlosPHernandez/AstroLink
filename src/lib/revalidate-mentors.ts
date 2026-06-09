import 'server-only';

import { revalidateTag } from 'next/cache';

/** Call after mentor directory rows change (listing, compliance, profile). */
export function revalidateMentorDirectory() {
  revalidateTag('mentors', 'max');
}
