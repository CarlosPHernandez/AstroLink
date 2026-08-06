import 'server-only';

import { getAppBaseUrl } from '@/lib/app-url';
import {
  pathAssessmentBookingPath,
  pathAssessmentResultsPath,
} from '@/lib/path-assessment/public-url';

export function pathAssessmentResultsUrl(token: string): string {
  return `${getAppBaseUrl()}${pathAssessmentResultsPath(token)}`;
}

export function pathAssessmentBookingUrl(token: string): string {
  return `${getAppBaseUrl()}${pathAssessmentBookingPath(token)}`;
}
