/** Client-safe path helpers (no server-only imports). */

export function pathAssessmentResultsPath(token: string): string {
  return `/assessment/results/${encodeURIComponent(token)}`;
}

export function pathAssessmentBookingPath(token: string): string {
  return `/booking?assessment=${encodeURIComponent(token)}`;
}

/** Checkout for $50 written expert review of an existing assessment. */
export function pathAssessmentWrittenReviewPath(assessmentToken: string): string {
  return `/assessment/written-review?assessment=${encodeURIComponent(assessmentToken)}`;
}

export function pathAssessmentWrittenReviewViewPath(reviewToken: string): string {
  return `/assessment/reviews/${encodeURIComponent(reviewToken)}`;
}

/** Prefill booking goals/background from assessment answers. */
export function answersToBookingPrefill(answers: {
  primaryGoal: string;
  experience: string;
  stage: string;
  network: string;
  obstacle: string;
  firstName: string;
}): { goals: string; background: string } {
  const goals = [
    answers.primaryGoal.trim(),
    answers.obstacle.trim()
      ? `Biggest obstacle / clarity need: ${answers.obstacle.trim()}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const background = [
    answers.stage ? `Stage: ${answers.stage}` : '',
    answers.network ? `Network: ${answers.network}` : '',
    answers.experience.trim(),
  ]
    .filter(Boolean)
    .join('\n');

  return { goals, background };
}
