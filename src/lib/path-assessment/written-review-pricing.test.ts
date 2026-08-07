import { describe, expect, it } from 'vitest';
import {
  WRITTEN_REPORT_REVIEW_CENTS,
  WRITTEN_REPORT_REVIEW_PRODUCT,
  WRITTEN_REPORT_REVIEW_SLA_DAYS,
} from '@/lib/path-assessment/written-review-pricing';

describe('written-review-pricing', () => {
  it('locks $50 tripwire product constants', () => {
    expect(WRITTEN_REPORT_REVIEW_CENTS).toBe(5000);
    expect(WRITTEN_REPORT_REVIEW_SLA_DAYS).toBe(5);
    expect(WRITTEN_REPORT_REVIEW_PRODUCT).toBe('path_assessment_written_review');
  });
});
