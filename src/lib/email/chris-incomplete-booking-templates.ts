/**
 * Ops email: signed up / completed auth but did not finish Chris booking.
 * Manual Resend send via scripts/send-chris-incomplete-booking.mjs — not auto-triggered.
 *
 * Distinct from the early-waitlist marketing sequence
 * (`chris-early-waitlist-sequence-templates.ts`).
 */

export const CHRIS_INCOMPLETE_BOOKING_CTA_URL =
  'https://www.astro-link.space/talk-with-chris?ref=booking-incomplete';

export type ChrisIncompleteBookingContact = {
  email: string;
  /**
   * Optional first name from auth profile.
   * When missing, greeting is "Hey," (email-only / unknown name).
   */
  name?: string;
  /** Override CTA (e.g. `ref=early-signups` for waitlist pricing). */
  ctaUrl?: string;
};

export type ChrisIncompleteBookingEmail = {
  templateId: 'chris-incomplete-booking';
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** First token of a display name, or null if empty / email-like. */
export function firstNameFromContact(name?: string): string | null {
  const raw = name?.trim();
  if (!raw || raw.includes('@')) return null;
  const first = raw.split(/\s+/)[0];
  if (!first || first.length > 40) return null;
  return first;
}

export function greetingLine(name?: string): string {
  const first = firstNameFromContact(name);
  return first ? `Hey ${first},` : 'Hey,';
}

function ctaHref(contact: ChrisIncompleteBookingContact): string {
  return contact.ctaUrl?.trim() || CHRIS_INCOMPLETE_BOOKING_CTA_URL;
}

/**
 * Primary action button. Nested table + align=center for Gmail/Outlook.
 */
function ctaButtonHtml(label: string, href: string, opts?: { margin?: string }): string {
  const margin = opts?.margin ?? '20px 0 24px';
  const safeHref = escapeHtml(href);
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:${margin};margin-left:auto;margin-right:auto;">
  <tr>
    <td align="center" bgcolor="#ffffff" style="border-radius:8px;background-color:#ffffff;">
      <a href="${safeHref}" target="_blank" style="display:inline-block;background-color:#ffffff;color:#1c1c1c;text-decoration:none;border-radius:8px;padding:14px 20px;font-size:14px;font-weight:700;letter-spacing:0.02em;font-family:Geist,Inter,Arial,Helvetica,sans-serif;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`.trim();
}

function emailShell(params: {
  preheader: string;
  title: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote?: string;
  appendFooterCta?: boolean;
}): string {
  const appendFooterCta = params.appendFooterCta !== false;
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(params.title)}</title>
  <!--[if mso]>
  <style type="text/css">table,td{font-family:Arial,Helvetica,sans-serif!important;}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;width:100%;background-color:#1c1c1c;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#1c1c1c;opacity:0;">
    ${escapeHtml(params.preheader)}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#1c1c1c;margin:0;padding:0;">
    <tr>
      <td align="center" valign="top" style="padding:24px 12px;text-align:center;background-color:#1c1c1c;">
        <!--[if mso]>
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" align="center"><tr><td>
        <![endif]-->
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" align="center" style="width:100%;max-width:560px;border-collapse:collapse;background-color:#1c1c1c;border:1px solid #333333;margin:0 auto;text-align:left;">
          <tr>
            <td align="center" style="padding:16px 20px;border-bottom:1px solid #333333;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;font-family:Geist,Inter,Arial,Helvetica,sans-serif;text-align:center;">
              AstroLink
            </td>
          </tr>
          <tr>
            <td align="left" style="padding:20px 20px 6px;font-family:Geist,Inter,Arial,Helvetica,sans-serif;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#b4c5ff;text-align:center;">Private session · Chris Sembroski</div>
              <h1 style="margin:10px 0 0;color:#ffffff;font-size:22px;line-height:1.25;font-weight:600;text-align:center;">${escapeHtml(params.title)}</h1>
            </td>
          </tr>
          <tr>
            <td align="left" style="padding:6px 20px 20px;color:#e5e2e1;font-size:15px;line-height:1.55;font-weight:300;font-family:Geist,Inter,Arial,Helvetica,sans-serif;text-align:left;">
              ${params.bodyHtml}
              ${
                appendFooterCta
                  ? ctaButtonHtml(params.ctaLabel, params.ctaUrl, { margin: '20px auto 0' })
                  : ''
              }
              ${
                params.footerNote
                  ? `<p style="margin:16px 0 0;font-size:12px;line-height:1.45;color:#c9c6c5;text-align:center;">${params.footerNote}</p>`
                  : ''
              }
            </td>
          </tr>
        </table>
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function helpOptionsHtml(href: string): string {
  const safeHref = escapeHtml(href);
  return `
<ul style="margin:8px 0 0;padding-left:18px;color:#e5e2e1;">
  <li style="margin-bottom:8px;"><strong style="color:#fff;font-weight:600;">Reply to this email</strong> — we’ll walk you through the last steps</li>
  <li style="margin-bottom:8px;"><strong style="color:#fff;font-weight:600;">Tell us what stopped you</strong> — we’ll fix it on our end if we can</li>
  <li style="margin-bottom:8px;"><strong style="color:#fff;font-weight:600;">Finish yourself</strong> — <a href="${safeHref}" target="_blank" style="color:#b4c5ff;text-decoration:underline;">open the booking page</a></li>
</ul>`.trim();
}

function includedStackHtml(): string {
  return `
<ul style="margin:8px 0 0;padding-left:18px;color:#e5e2e1;">
  <li style="margin-bottom:6px;">A guaranteed <strong style="color:#fff;font-weight:600;">45-minute 1:1</strong> video call with Chris</li>
  <li style="margin-bottom:6px;">Chris reviews your goals and questions beforehand</li>
  <li style="margin-bottom:6px;">Pre-call brief + post-call notes</li>
  <li style="margin-bottom:6px;">Personalized follow-up from Chris after the call</li>
</ul>`.trim();
}

/**
 * Check-in for users who completed auth / started booking but never paid.
 */
export function buildChrisIncompleteBookingEmail(
  contact: ChrisIncompleteBookingContact,
): ChrisIncompleteBookingEmail {
  void contact.email;
  const href = ctaHref(contact);
  const greeting = greetingLine(contact.name);
  const subject = 'Quick check-in on your session with Chris';
  const ctaLabel = 'FINISH BOOKING YOUR SESSION';
  const title = 'Need a hand finishing?';

  const bodyHtml = `
<p style="margin:0 0 16px;">${escapeHtml(greeting)}</p>
<p style="margin:0 0 12px;">
  I noticed you started booking a private session with Chris but didn’t complete it.
</p>
<p style="margin:0 0 12px;">
  Just checking in personally in case something got in the way — a technical issue, a question
  about the process, or anything else.
</p>
<p style="margin:0 0 6px;color:#fff;font-weight:600;">How we can help:</p>
${helpOptionsHtml(href)}
${ctaButtonHtml(ctaLabel, href, { margin: '16px 0 16px' })}
<p style="margin:0 0 6px;color:#fff;font-weight:600;">What you get once it’s booked:</p>
${includedStackHtml()}
<p style="margin:14px 0 0;">
  No pressure at all — reply anytime and we’ll make this easy for you.
</p>
<p style="margin:16px 0 0;color:#c9c6c5;font-size:14px;line-height:1.5;">
  Best,<br />
  <strong style="color:#fff;font-weight:600;">The AstroLink Team</strong>
</p>
  `.trim();

  const text = [
    greeting,
    '',
    'I noticed you started booking a private session with Chris but didn’t complete it.',
    '',
    'Just checking in personally in case something got in the way — a technical issue, a question about the process, or anything else.',
    '',
    'How we can help:',
    '• Reply to this email — we’ll walk you through the last steps',
    '• Tell us what stopped you — we’ll fix it on our end if we can',
    `• Finish yourself: ${href}`,
    '',
    `${ctaLabel}: ${href}`,
    '',
    'What you get once it’s booked:',
    '• A guaranteed 45-minute 1:1 video call with Chris',
    '• Chris reviews your goals and questions beforehand',
    '• Pre-call brief + post-call notes',
    '• Personalized follow-up from Chris after the call',
    '',
    'No pressure at all — reply anytime and we’ll make this easy for you.',
    '',
    'Best,',
    'The AstroLink Team',
  ].join('\n');

  return {
    templateId: 'chris-incomplete-booking',
    subject,
    html: emailShell({
      preheader: 'Need a hand finishing your private session with Chris? Reply anytime.',
      title,
      bodyHtml,
      ctaLabel,
      ctaUrl: href,
      // CTA already in body; keep card compact.
      appendFooterCta: false,
      footerNote: 'Reply to this email if you need help — we read every message.',
    }),
    text,
  };
}
