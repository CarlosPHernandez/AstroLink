import { describe, expect, it } from 'vitest';
import { pathAssessmentBookingPath } from './public-url';

describe('pathAssessmentBookingPath', () => {
  it('attaches the assessment token', () => {
    expect(pathAssessmentBookingPath('abc')).toBe('/booking?assessment=abc');
  });

  it('preselects a matched expert when a slug is provided', () => {
    expect(pathAssessmentBookingPath('abc', 'chris-sembroski')).toBe(
      '/booking?assessment=abc&mentor=chris-sembroski',
    );
  });
});
