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

  it('drops invalid referrer values', () => {
    const result = EarlyAccessBodySchema.parse({
      email: 'test@example.com',
      referrer: '<script>alert(1)</script>',
    });
    expect(result.referrer).toBeUndefined();
  });

  it('rejects honeypot submissions', () => {
    const result = EarlyAccessBodySchema.safeParse({
      email: 'test@example.com',
      company: 'Acme Corp',
    });
    expect(result.success).toBe(false);
  });
});
