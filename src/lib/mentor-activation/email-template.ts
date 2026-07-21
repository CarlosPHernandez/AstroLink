function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildMentorActivationEmailHtml(params: {
  expertName: string;
  activateUrl: string;
  expiresAtIso: string;
}): string {
  const name = escapeHtml(params.expertName);
  const url = escapeHtml(params.activateUrl);
  const expires = escapeHtml(
    new Date(params.expiresAtIso).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'America/New_York',
    }),
  );

  return `<!DOCTYPE html>
<html>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #0f172a;">
  <p>Hi ${name},</p>
  <p>Your AstroLink expert account is ready. Confirm your profile details to access your dashboard and sessions.</p>
  <p style="margin: 24px 0;">
    <a href="${url}" style="display: inline-block; background: #0058bc; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">
      Activate your account
    </a>
  </p>
  <p style="font-size: 14px; color: #475569;">This link expires ${expires} (Eastern). If you did not expect this email, you can ignore it.</p>
  <p style="font-size: 14px; color: #475569;">— AstroLink</p>
</body>
</html>`;
}
