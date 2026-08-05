import React from 'react';
import { requireRole } from '@/lib/require-session';
import ExpertReviewModerationClient from './expert-review-moderation-client';

export default async function ExpertReviewsPage() {
  await requireRole('admin');

  return <ExpertReviewModerationClient />;
}
