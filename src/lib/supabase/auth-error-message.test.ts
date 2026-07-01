import { describe, expect, it } from 'vitest';
import {
  mapSupabaseSignInError,
  mapSupabaseSignUpError,
} from '@/lib/supabase/auth-error-message';

describe('mapSupabaseSignUpError', () => {
  it('maps duplicate registration', () => {
    expect(
      mapSupabaseSignUpError({
        message: 'User already registered',
        code: 'user_already_registered',
      }),
    ).toContain('Sign in instead');
  });

  it('maps email send rate limit', () => {
    expect(
      mapSupabaseSignUpError({
        message: 'email rate limit exceeded',
        status: 429,
        code: 'over_email_send_rate_limit',
      }),
    ).toContain('Too many sign-up attempts');
  });

  it('maps invalid email domain', () => {
    expect(
      mapSupabaseSignUpError({
        message: 'Email address "foo@test.com" is invalid',
        code: 'email_address_invalid',
      }),
    ).toContain('test domains');
  });

  it('falls back to generic message', () => {
    expect(mapSupabaseSignUpError({ message: 'something unexpected' })).toContain(
      'Could not create account',
    );
  });
});

describe('mapSupabaseSignInError', () => {
  it('maps unconfirmed email', () => {
    expect(
      mapSupabaseSignInError({
        message: 'Email not confirmed',
        code: 'email_not_confirmed',
      }),
    ).toContain('Confirm your email');
  });

  it('maps invalid credentials', () => {
    expect(mapSupabaseSignInError({ message: 'Invalid login credentials' })).toBe(
      'Invalid email or password.',
    );
  });
});
