import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { firstFieldError, formLevelSummary, toFieldErrors } from '@/lib/zod-field-errors';

describe('zod-field-errors', () => {
  const schema = z.object({
    email: z.string().email({ message: 'Enter a valid email address.' }),
    name: z.string().min(2, { message: 'Enter your full name.' }),
  });

  it('toFieldErrors maps Zod flatten field errors', () => {
    const result = schema.safeParse({ email: 'bad', name: 'a' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = toFieldErrors(result.error);
      expect(errors.email?.[0]).toBe('Enter a valid email address.');
      expect(errors.name?.[0]).toBe('Enter your full name.');
    }
  });

  it('firstFieldError returns the first message for a field', () => {
    const errors = { goals: ['Add at least 10 characters so your expert can prepare.'] };
    expect(firstFieldError(errors, 'goals')).toBe(
      'Add at least 10 characters so your expert can prepare.',
    );
    expect(firstFieldError(errors, 'background')).toBeUndefined();
  });

  it('formLevelSummary returns a calm form-level message', () => {
    expect(formLevelSummary()).toBe('Check the highlighted fields.');
  });
});