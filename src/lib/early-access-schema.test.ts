import { describe, expect, it } from 'vitest';
import { EarlyAccessBodySchema } from './early-access-schema';

describe('EarlyAccessBodySchema', () => {
  it('normalizes and validates email', () => {
    const result = EarlyAccessBodySchema.parse({ email: '  Test@Example.COM  ' });
    expect(result.email).toBe('test@example.com');
  });

  it('rejects invalid email', () => {
    const result = EarlyAccessBodySchema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
  });
});
