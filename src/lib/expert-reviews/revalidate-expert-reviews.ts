import 'server-only';

import { revalidateTag } from 'next/cache';

/** Call after approving, hiding, or editing a public expert review. */
export function revalidateExpertReviews(expertId?: string) {
  revalidateTag('expert-reviews', 'max');
  revalidateTag('landing-public-reviews', 'max');
  if (expertId?.trim()) {
    revalidateTag(`expert-reviews-${expertId.trim()}`, 'max');
  }
}
