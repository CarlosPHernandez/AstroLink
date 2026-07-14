/**
 * Pre-booking marketing sequence: early waitlist → Chris $180 booking.
 * Post-payment confirmation/brief emails stay in booking-confirmed-templates + NotificationAgent.
 *
 * @see docs/how-to/chris-early-waitlist-email-automation.md
 */

export const CHRIS_EARLY_WAITLIST_CTA_URL =
  'https://www.astro-link.space/talk-with-chris?ref=early-signups';

/** Canonical landing without query (for copy that must match exact marketing URL). */
export const CHRIS_EARLY_WAITLIST_CTA_URL_PLAIN =
  'https://www.astro-link.space/talk-with-chris';

export const CHRIS_EARLY_OFFER = {
  priceLabel: '$180',
  priceCents: 18_000,
  durationMinutes: 45,
  slotCount: 15,
} as const;

export type ChrisEarlyWaitlistContact = {
  /**
   * Optional — early-access waitlist only collected email.
   * Templates never personalize with first name (Resend audience has email only).
   */
  name?: string;
  /** Contact email (for footer / send target). */
  email: string;
  /** Override CTA (e.g. tracked redirect). Defaults to ref=early-signups URL. */
  ctaUrl?: string;
};

/** Generic greeting — no first name (waitlist CSV is email-only). */
export const CHRIS_SEQUENCE_GREETING = 'Hey,';

export type ChrisSequenceEmail = {
  templateId:
    | 'chris-initial-offer'
    | 'chris-clicked-reminder'
    | 'chris-value-nurture'
    | 'chris-final-urgency';
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

function ctaHref(contact: ChrisEarlyWaitlistContact): string {
  return contact.ctaUrl?.trim() || CHRIS_EARLY_WAITLIST_CTA_URL;
}

function greetingHtml(): string {
  return `<p style="margin:0 0 16px;">${escapeHtml(CHRIS_SEQUENCE_GREETING)}</p>`;
}

/**
 * Primary action button (mid-email + footer).
 * Nested table + align=center is more reliable than text-align alone in Gmail/Outlook.
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
  /** When false, body already includes both CTAs (avoids a third button). Default true. */
  appendFooterCta?: boolean;
}): string {
  const appendFooterCta = params.appendFooterCta !== false;
  // Outer 100% + align=center + fixed-width inner table centers the card in Gmail/Apple/Outlook.
  // Body copy stays left-aligned inside the card (easier to read).
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
              <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#b4c5ff;text-align:center;">Early access · 15 slots</div>
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

function valueStackHtml(): string {
  return `
<ul style="margin:12px 0 0;padding-left:18px;color:#e5e2e1;">
  <li style="margin-bottom:8px;">Full <strong style="color:#fff;font-weight:600;">45-minute</strong> private video call with Chris</li>
  <li style="margin-bottom:8px;">Chris knows your name, goals, and questions before the call</li>
  <li style="margin-bottom:8px;">AI pre-call brief with suggested questions tailored to what you submit</li>
  <li style="margin-bottom:8px;">Post-call actionable brief with clear next steps</li>
</ul>`.trim();
}

function bonusesHtml(): string {
  return `
<ul style="margin:12px 0 0;padding-left:18px;color:#e5e2e1;">
  <li style="margin-bottom:8px;">AI pre-brief with suggested questions based on your goals and background</li>
  <li style="margin-bottom:8px;">Post-call actionable brief</li>
  <li style="margin-bottom:8px;">Chris’s personalized follow-up note within 48 hours</li>
  <li style="margin-bottom:8px;">Call recording (subject to Chris’s approval)</li>
  <li style="margin-bottom:8px;">Curated list of 3 resources Chris recommends for your specific goals</li>
</ul>`.trim();
}

function guaranteeHtml(variant: 'default' | 'initial' = 'default'): string {
  const body =
    variant === 'initial'
      ? `Chris reviews everything you submit before the call. If it doesn’t address what you put in the form, you get a follow-up resource package or priority reschedule at no extra cost.`
      : `Chris reviews your goals before the call. If the session doesn’t address what you submitted, you get a follow-up package or priority reschedule at no extra cost.`;

  return `
<div style="margin:14px 0;padding:12px 14px;border:1px solid #334b84;border-radius:8px;background:#00174c;">
  <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#b4c5ff;margin-bottom:6px;">Chris Preparation Guarantee</div>
  <p style="margin:0;color:#e5e2e1;font-size:13px;line-height:1.5;">
    ${body}
  </p>
</div>`.trim();
}

function initialOfferValueStackHtml(): string {
  return `
<ul style="margin:8px 0 0;padding-left:18px;color:#e5e2e1;">
  <li style="margin-bottom:6px;">Full <strong style="color:#fff;font-weight:600;">45-minute</strong> private video call with Chris</li>
  <li style="margin-bottom:6px;">Chris prepped on your goals, questions, and background</li>
  <li style="margin-bottom:6px;">Pre-call brief with tailored questions</li>
  <li style="margin-bottom:6px;">Post-call actionable brief with next steps</li>
</ul>`.trim();
}

function initialOfferBonusesHtml(): string {
  return `
<ul style="margin:8px 0 0;padding-left:18px;color:#e5e2e1;">
  <li style="margin-bottom:6px;">Personalized follow-up note within 48 hours</li>
  <li style="margin-bottom:6px;">Call recording (subject to approval)</li>
  <li style="margin-bottom:6px;">3 resources Chris recommends for your goals</li>
</ul>`.trim();
}

/** Step 1 — immediate on chris_early_waitlist_launch */
export function buildChrisInitialOfferEmail(
  contact: ChrisEarlyWaitlistContact,
): ChrisSequenceEmail {
  void contact.email;
  const href = ctaHref(contact);
  const subject =
    'Your early access slot with Astronaut Chris Sembroski is now open (only 15 spots)';
  const ctaLabel = 'SELECT YOUR DAY AND REQUEST YOUR SESSION';

  // Keep this short so Gmail/iOS don’t hide the lower half behind “···” expand.
  // Two CTAs: after hook (scanners) + after offer (full readers) — both above long tail.
  const bodyHtml = `
${greetingHtml()}
<p style="margin:0 0 12px;">You signed up early for a reason.</p>
<p style="margin:0 0 12px;">
  Private 45-minute 1:1 sessions with Astronaut Chris Sembroski are live for the original waitlist
  — before the public. <strong style="color:#fff;font-weight:600;">Only 15 spots.</strong>
</p>
${ctaButtonHtml(ctaLabel, href, { margin: '4px 0 16px' })}
<p style="margin:0 0 12px;">
  Chris went from engineer to orbit on Inspiration4. In one private call he answers <em>your</em>
  goals and questions — not a generic Q&amp;A. Most people spend $1,500+ on events hoping for a few
  minutes with someone like Chris. You get a full guaranteed 45 minutes for
  <strong style="color:#fff;font-weight:600;">$180</strong> (normally $200).
</p>
<p style="margin:0 0 6px;color:#fff;font-weight:600;">You receive:</p>
${initialOfferValueStackHtml()}
<p style="margin:12px 0 6px;color:#fff;font-weight:600;">Plus:</p>
${initialOfferBonusesHtml()}
${guaranteeHtml('initial')}
<p style="margin:0 0 8px;">
  15 slots. Early waitlist only. Slots are filling in real time.
</p>
${ctaButtonHtml(ctaLabel, href, { margin: '8px 0 12px' })}
<p style="margin:0;font-size:13px;color:#c9c6c5;line-height:1.45;">
  P.S. This round is not public. First access to the $180 rate — when these 15 are gone, the rate
  returns to the original price.
</p>
  `.trim();

  const text = [
    CHRIS_SEQUENCE_GREETING,
    '',
    'You signed up early for a reason.',
    '',
    'Private 45-minute 1:1 sessions with Astronaut Chris Sembroski are live for the original waitlist — before the public. Only 15 spots.',
    '',
    `${ctaLabel}: ${href}`,
    '',
    'Chris went from engineer to orbit on Inspiration4. In one private call he answers your goals and questions — not a generic Q&A. Most people spend $1,500+ on events hoping for a few minutes with someone like Chris. You get a full guaranteed 45 minutes for $180 (normally $200).',
    '',
    'You receive:',
    '• Full 45-minute private video call with Chris',
    '• Chris prepped on your goals, questions, and background',
    '• Pre-call brief with tailored questions',
    '• Post-call actionable brief with next steps',
    '',
    'Plus:',
    '• Personalized follow-up note within 48 hours',
    '• Call recording (subject to approval)',
    '• 3 resources Chris recommends for your goals',
    '',
    'CHRIS PREPARATION GUARANTEE: Chris reviews everything you submit before the call. If it doesn’t address what you put in the form, you get a follow-up resource package or priority reschedule at no extra cost.',
    '',
    '15 slots. Early waitlist only. Filling in real time.',
    '',
    `${ctaLabel}: ${href}`,
    '',
    'P.S. This round is not public. First access to the $180 rate — when these 15 are gone, the rate returns to the original price.',
  ].join('\n');

  return {
    templateId: 'chris-initial-offer',
    subject,
    html: emailShell({
      preheader: 'Only 15 early-access slots · $180 (normally $200) · 45 min with Chris',
      title: 'Your early access slot is open',
      bodyHtml,
      ctaLabel,
      ctaUrl: href,
      // Both CTAs live in the body so the full message stays compact and above any client “···” trim.
      appendFooterCta: false,
    }),
    text,
  };
}

/** Branch A — clicked Email 1 CTA, not booked (~day 3) */
export function buildChrisClickedReminderEmail(
  contact: ChrisEarlyWaitlistContact,
): ChrisSequenceEmail {
  void contact.email;
  const href = ctaHref(contact);
  const subject =
    'You started the process with Chris Sembroski - finish before the remaining slots close';

  const ctaLabel = 'SELECT YOUR DAY AND REQUEST YOUR SESSION';
  const bodyHtml = `
${greetingHtml()}
<p style="margin:0 0 12px;">
  You opened the path to a 45-minute 1:1 with Chris. He answers your goals and questions directly —
  with your background already reviewed.
</p>
${ctaButtonHtml(ctaLabel, href, { margin: '4px 0 16px' })}
<p style="margin:0 0 12px;">
  Pre- and post-call briefs remove the prep work. Early access is $180.
  <strong style="color:#fff;font-weight:600;">Only 15 slots</strong> — finish your day selection
  before the remaining seats close.
</p>
  `.trim();

  const text = [
    CHRIS_SEQUENCE_GREETING,
    '',
    'You opened the path to a 45-minute 1:1 with Chris. He answers your goals and questions directly, with your background reviewed.',
    '',
    `${ctaLabel}: ${href}`,
    '',
    'Pre- and post-call briefs remove the prep work. Early access is $180. Only 15 slots — finish your day selection before the remaining seats close.',
    '',
    `${ctaLabel}: ${href}`,
  ].join('\n');

  return {
    templateId: 'chris-clicked-reminder',
    subject,
    html: emailShell({
      preheader: 'Finish booking · 15 early-access slots · $180',
      title: 'Finish before the remaining slots close',
      bodyHtml,
      ctaLabel,
      ctaUrl: href,
    }),
    text,
  };
}

/** Branch B — no click on Email 1 (~day 3) */
export function buildChrisValueNurtureEmail(
  contact: ChrisEarlyWaitlistContact,
): ChrisSequenceEmail {
  void contact.email;
  const href = ctaHref(contact);
  const subject =
    'What changes when you get direct answers from someone who has been to space';

  const ctaLabel = 'SELECT YOUR DAY AND REQUEST YOUR SESSION';
  const bodyHtml = `
${greetingHtml()}
<p style="margin:0 0 12px;">
  Most space career advice is generic. With Chris, you get specificity: engineer, crew member, and
  the public face of a mission. You leave knowing which path matches your goals.
</p>
${ctaButtonHtml(ctaLabel, href, { margin: '4px 0 16px' })}
<p style="margin:0 0 6px;color:#fff;font-weight:600;">For $180 (early access):</p>
${valueStackHtml()}
<p style="margin:12px 0 6px;color:#fff;font-weight:600;">Plus:</p>
${bonusesHtml()}
<p style="margin:12px 0 0;">
  Only 15 early-waitlist slots — before any public offer.
</p>
  `.trim();

  const text = [
    CHRIS_SEQUENCE_GREETING,
    '',
    'Most space career advice is generic. With Chris, you get specificity: engineer, crew member, and the public face of a mission. You leave knowing which path matches your goals.',
    '',
    `${ctaLabel}: ${href}`,
    '',
    'For $180: 45-min private call, Chris knows your goals, AI pre-brief, post-call brief.',
    'Bonuses: follow-up within 48h, recording (with approval), 3 curated resources.',
    '',
    'Only 15 early-waitlist slots — before any public offer.',
    '',
    `${ctaLabel}: ${href}`,
  ].join('\n');

  return {
    templateId: 'chris-value-nurture',
    subject,
    html: emailShell({
      preheader: '45 minutes of direct answers · $180 early access · 15 slots',
      title: 'Direct answers from someone who has been to space',
      bodyHtml,
      ctaLabel,
      ctaUrl: href,
    }),
    text,
  };
}

/** Final — ~day 7 if still not booked */
export function buildChrisFinalUrgencyEmail(
  contact: ChrisEarlyWaitlistContact,
): ChrisSequenceEmail {
  void contact.email;
  const href = ctaHref(contact);
  const subject =
    'Last early access chance: 45 minutes with Chris Sembroski - slots closing';

  const ctaLabel = 'SELECT YOUR DAY AND REQUEST YOUR SESSION';
  const bodyHtml = `
${greetingHtml()}
<p style="margin:0 0 12px;">
  Last early-access note. Waitlist slots for a private 45-minute 1:1 with Chris are closing.
  This $180 offer is not public yet — and these 15 seats will not wait.
</p>
${ctaButtonHtml(ctaLabel, href, { margin: '4px 0 16px' })}
<p style="margin:0 0 6px;color:#fff;font-weight:600;">For $180 you get:</p>
${valueStackHtml()}
<p style="margin:12px 0 6px;color:#fff;font-weight:600;">Plus:</p>
${bonusesHtml()}
${guaranteeHtml()}
  `.trim();

  const text = [
    CHRIS_SEQUENCE_GREETING,
    '',
    'Last early-access note. 15 waitlist slots for a 45-minute 1:1 with Chris are closing. $180 is not a public offer yet.',
    '',
    `${ctaLabel}: ${href}`,
    '',
    'You get: private video call, Chris reviews your goals, AI pre-brief, post-call brief.',
    'Bonuses: 48h follow-up note, recording (approval), 3 curated resources.',
    'Chris Preparation Guarantee applies.',
    '',
    `${ctaLabel}: ${href}`,
  ].join('\n');

  return {
    templateId: 'chris-final-urgency',
    subject,
    html: emailShell({
      preheader: 'Slots closing · $180 · 45 min with Chris · last early-access note',
      title: 'Last early access chance — slots closing',
      bodyHtml,
      ctaLabel,
      ctaUrl: href,
      footerNote: 'Early access for waitlist only. Not a public booking window.',
    }),
    text,
  };
}

export type ChrisSequenceTemplateId = ChrisSequenceEmail['templateId'];

export function buildChrisSequenceEmail(
  templateId: ChrisSequenceTemplateId,
  contact: ChrisEarlyWaitlistContact,
): ChrisSequenceEmail {
  switch (templateId) {
    case 'chris-initial-offer':
      return buildChrisInitialOfferEmail(contact);
    case 'chris-clicked-reminder':
      return buildChrisClickedReminderEmail(contact);
    case 'chris-value-nurture':
      return buildChrisValueNurtureEmail(contact);
    case 'chris-final-urgency':
      return buildChrisFinalUrgencyEmail(contact);
    default: {
      const _exhaustive: never = templateId;
      throw new Error(`Unknown Chris sequence template: ${_exhaustive}`);
    }
  }
}
