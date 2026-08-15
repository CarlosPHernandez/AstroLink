import 'server-only';

import { getAppBaseUrl } from '@/lib/app-url';
import {
  pathAssessmentBookingPath,
  pathAssessmentResultsPath,
  pathAssessmentWrittenReviewPath,
  pathAssessmentWrittenReviewViewPath,
} from '@/lib/path-assessment/public-url';

export function pathAssessmentResultsUrl(token: string): string {
  return `${getAppBaseUrl()}${pathAssessmentResultsPath(token)}`;
}

export function pathAssessmentBookingUrl(
  token: string,
  mentorSlug?: string | null,
): string {
  return `${getAppBaseUrl()}${pathAssessmentBookingPath(token, mentorSlug)}`;
}

export function pathAssessmentWrittenReviewUrl(assessmentToken: string): string {
  return `${getAppBaseUrl()}${pathAssessmentWrittenReviewPath(assessmentToken)}`;
}

export function pathAssessmentWrittenReviewViewUrl(reviewToken: string): string {
  return `${getAppBaseUrl()}${pathAssessmentWrittenReviewViewPath(reviewToken)}`;
}
