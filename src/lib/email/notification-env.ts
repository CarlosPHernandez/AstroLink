import 'server-only';

export function isNotificationsDisabled(): boolean {
  return process.env.NOTIFICATIONS_DISABLED === 'true';
}

export function getResendApiKey(): string | undefined {
  const key = process.env.RESEND_API_KEY?.trim();
  return key || undefined;
}

export function getResendFrom(): string {
  return process.env.RESEND_FROM?.trim() || 'AstroLink <notifications@astro-link.space>';
}