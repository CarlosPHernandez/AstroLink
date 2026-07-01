/** Maps Supabase Auth API errors to user-facing copy for sign-up flows. */
export function mapSupabaseSignUpError(error: {
  message?: string;
  status?: number;
  code?: string;
}): string {
  const message = error.message?.toLowerCase() ?? '';
  const code = error.code?.toLowerCase() ?? '';

  if (
    code === 'user_already_registered' ||
    message.includes('already registered') ||
    message.includes('already been registered')
  ) {
    return 'An account with this email already exists. Sign in instead, or use a different email.';
  }

  if (
    code === 'over_email_send_rate_limit' ||
    error.status === 429 ||
    message.includes('rate limit')
  ) {
    return 'Too many sign-up attempts. Wait a few minutes, then try Sign in if you already created an account.';
  }

  if (
    code === 'email_address_invalid' ||
    (message.includes('email address') && message.includes('invalid'))
  ) {
    return 'That email address is not accepted. Use a real inbox (Gmail, iCloud, etc.) — test domains like @test.com are blocked.';
  }

  if (message.includes('password') && (message.includes('weak') || message.includes('pwned'))) {
    return 'Choose a stronger password (mix letters, numbers, and symbols).';
  }

  if (code === 'signup_disabled' || message.includes('signup is disabled')) {
    return 'New account sign-up is temporarily unavailable. Try again later or contact support.';
  }

  return 'Could not create account. Try signing in or use a different email.';
}

/** Maps Supabase Auth API errors to user-facing copy for sign-in flows. */
export function mapSupabaseSignInError(error: {
  message?: string;
  status?: number;
  code?: string;
}): string {
  const message = error.message?.toLowerCase() ?? '';
  const code = error.code?.toLowerCase() ?? '';

  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return 'Confirm your email first — check your inbox for the link, then sign in here.';
  }

  if (code === 'invalid_credentials' || message.includes('invalid login')) {
    return 'Invalid email or password.';
  }

  if (error.status === 429 || message.includes('rate limit')) {
    return 'Too many sign-in attempts. Wait a few minutes and try again.';
  }

  return 'Invalid email or password.';
}
