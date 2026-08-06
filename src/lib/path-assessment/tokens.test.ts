import { describe, expect, it } from 'vitest';
import {
  generatePathAssessmentPublicToken,
  isValidPathAssessmentToken,
} from '@/lib/path-assessment/tokens';

describe('path assessment tokens', () => {
  it('generates 64-char hex tokens', () => {
    const token = generatePathAssessmentPublicToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(isValidPathAssessmentToken(token)).toBe(true);
  });

  it('rejects short or non-hex tokens', () => {
    expect(isValidPathAssessmentToken('abc')).toBe(false);
    expect(isValidPathAssessmentToken('g'.repeat(64))).toBe(false);
  });
});
