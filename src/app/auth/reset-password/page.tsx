import { redirect } from 'next/navigation';

/**
 * Friendly alias — password reset request lives at /auth/forgot-password.
 * Email recovery links still land on /auth/callback → /auth/update-password.
 */
export default function ResetPasswordAliasPage() {
  redirect('/auth/forgot-password');
}
