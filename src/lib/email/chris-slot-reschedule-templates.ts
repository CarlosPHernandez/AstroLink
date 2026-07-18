/**
 * Ops concierge: warm reschedule email when preferred day (e.g. Monday) won't work.
 * Manual send via scripts/send-chris-slot-reschedule.mjs.
 *
 * No runtime imports so the CLI can load this file under node --experimental-strip-types.
 */

export type ChrisSlotRescheduleContact = {
  email: string;
  name?: string;
};

export type ChrisSlotRescheduleDayOffer = {
  dayKey: 'tue' | 'thu' | 'fri';
  /** e.g. "Tuesday" */
  dayLabel: string;
  /** e.g. "Tuesday, Jul 21 · 12:00–4:00 PM PDT" */
  summary: string;
};

export type ChrisSlotRescheduleEmail = {
  templateId: 'chris-slot-reschedule';
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

function firstNameFromContact(name?: string): string | null {
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

function ctaButtonHtml(label: string, href: string, opts?: { margin?: string }): string {
  const margin = opts?.margin ?? '12px 0';
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
  footerNote?: string;
}): string {
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
                params.footerNote
                  ? `<p style="margin:16px 0 0;font-size:12px;line-height:1.45;color:#c9c6c5;text-align:center;">${params.footerNote}</p>`
                  : ''
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function buildChrisSlotPickerUrl(params: {
  baseUrl: string;
  token: string;
  dayKey?: 'tue' | 'thu' | 'fri';
}): string {
  const base = params.baseUrl.replace(/\/$/, '');
  const qs = new URLSearchParams({ t: params.token });
  if (params.dayKey) {
    qs.set('day', params.dayKey);
  }
  return `${base}/r/chris-slot?${qs.toString()}`;
}

/**
 * Warm thank-you + soft reschedule (something came up on Chris's side).
 */
export function buildChrisSlotRescheduleEmail(params: {
  contact: ChrisSlotRescheduleContact;
  days: ChrisSlotRescheduleDayOffer[];
  pickerBaseUrl: string;
  token: string;
}): ChrisSlotRescheduleEmail {
  const greeting = greetingLine(params.contact.name);
  const subject = 'Thanks for booking Chris — pick a 45-minute time';
  const title = 'Chris is excited to meet you';
  const allHref = buildChrisSlotPickerUrl({
    baseUrl: params.pickerBaseUrl,
    token: params.token,
  });

  const dayButtons = params.days
    .map((d) => {
      const href = buildChrisSlotPickerUrl({
        baseUrl: params.pickerBaseUrl,
        token: params.token,
        dayKey: d.dayKey,
      });
      const shortLabel = `${d.dayLabel} · open hours`;
      return `
${ctaButtonHtml(shortLabel, href, { margin: '8px auto' })}
<p style="margin:0 0 12px;font-size:13px;color:#c9c6c5;text-align:center;">${escapeHtml(d.summary)}</p>
`.trim();
    })
    .join('\n');

  const bodyHtml = `
<p style="margin:0 0 16px;">${escapeHtml(greeting)}</p>
<p style="margin:0 0 12px;">
  Thank you for booking a private 45-minute session with Chris. He’s genuinely excited
  to meet you and go deep on your goals.
</p>
<p style="margin:0 0 12px;">
  Something came up on Chris’s side, so the Monday hold won’t work after all — totally
  on us. The good news: he opened a few other windows this week, and you can grab any
  <strong style="color:#fff;font-weight:600;">45-minute</strong> start that fits.
</p>
<p style="margin:0 0 8px;color:#fff;font-weight:600;">Pick a day to see times:</p>
${dayButtons}
${ctaButtonHtml('CHOOSE YOUR 45-MINUTE TIME', allHref, { margin: '16px auto 12px' })}
<p style="margin:12px 0 0;">
  You’ll confirm the exact start on the next screen. If none of these work, just reply
  to this email and we’ll figure it out together.
</p>
<p style="margin:16px 0 0;color:#c9c6c5;font-size:14px;line-height:1.5;">
  Best,<br />
  <strong style="color:#fff;font-weight:600;">The AstroLink Team</strong>
</p>
  `.trim();

  const textLines = [
    greeting,
    '',
    'Thank you for booking a private 45-minute session with Chris. He’s genuinely excited to meet you and go deep on your goals.',
    '',
    "Something came up on Chris’s side, so the Monday hold won’t work after all — totally on us. The good news: he opened a few other windows this week, and you can grab any 45-minute start that fits.",
    '',
    'Open times:',
    ...params.days.map((d) => `• ${d.summary}`),
    '',
    `Choose your 45-minute time: ${allHref}`,
    '',
    'If none of these work, reply to this email and we’ll figure it out together.',
    '',
    'Best,',
    'The AstroLink Team',
  ];

  return {
    templateId: 'chris-slot-reschedule',
    subject,
    html: emailShell({
      preheader:
        'Thanks for booking Chris — something came up Monday; pick a new 45-minute time.',
      title,
      bodyHtml,
      footerNote: 'Reply anytime if you need a different day — we read every message.',
    }),
    text: textLines.join('\n'),
  };
}
