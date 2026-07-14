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
  /** Contact {{name}} */
  name: string;
  /** Contact {{email}} */
  email: string;
  /** Override CTA (e.g. tracked redirect). Defaults to ref=early-signups URL. */
  ctaUrl?: string;
};

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

function displayName(name: string): string {
  const trimmed = name.trim();
  return trimmed || 'there';
}

function ctaHref(contact: ChrisEarlyWaitlistContact): string {
  return contact.ctaUrl?.trim() || CHRIS_EARLY_WAITLIST_CTA_URL;
}

function emailShell(params: {
  preheader: string;
  title: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote?: string;
}): string {
  const cta = escapeHtml(params.ctaUrl);
  return `
<div style="margin:0;padding:0;background:#1c1c1c;color:#ffffff;font-family:Geist,Inter,Arial,Helvetica,sans-serif;">
  <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${escapeHtml(params.preheader)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#1c1c1c;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:collapse;background:#1c1c1c;border:1px solid #333333;">
          <tr>
            <td style="padding:18px 24px;border-bottom:1px solid #333333;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">
              AstroLink
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 8px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#b4c5ff;">Early access · 15 slots</div>
              <h1 style="margin:12px 0 0;color:#ffffff;font-size:24px;line-height:1.2;font-weight:600;">${escapeHtml(params.title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 24px;color:#e5e2e1;font-size:15px;line-height:1.6;font-weight:300;">
              ${params.bodyHtml}
              <p style="margin:28px 0 8px;">
                <a href="${cta}" style="display:inline-block;background:#ffffff;color:#1c1c1c;text-decoration:none;border-radius:8px;padding:14px 20px;font-size:14px;font-weight:700;letter-spacing:0;">${escapeHtml(params.ctaLabel)}</a>
              </p>
              <p style="margin:12px 0 0;font-size:12px;color:#c9c6c5;word-break:break-all;">
                <a href="${cta}" style="color:#b4c5ff;text-decoration:underline;">${cta}</a>
              </p>
              ${
                params.footerNote
                  ? `<p style="margin:24px 0 0;padding-top:18px;border-top:1px dashed #333333;font-size:12px;color:#c9c6c5;">${params.footerNote}</p>`
                  : ''
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>
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

function guaranteeHtml(): string {
  return `
<div style="margin:20px 0;padding:16px;border:1px solid #334b84;border-radius:10px;background:#00174c;">
  <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#b4c5ff;margin-bottom:8px;">Chris Preparation Guarantee</div>
  <p style="margin:0;color:#e5e2e1;font-size:14px;line-height:1.55;">
    We make sure Chris reviews your goals, questions, and background before the call.
    If the session does not directly address what you submitted, we provide a follow-up
    resource package or priority reschedule at no extra cost.
  </p>
</div>`.trim();
}

/** Step 1 — immediate on chris_early_waitlist_launch */
export function buildChrisInitialOfferEmail(
  contact: ChrisEarlyWaitlistContact,
): ChrisSequenceEmail {
  const name = displayName(contact.name);
  const email = contact.email.trim();
  const href = ctaHref(contact);
  const subject =
    'Your early access slot with Astronaut Chris Sembroski is now open (only 15 spots)';

  const bodyHtml = `
<p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
<p style="margin:0 0 16px;">
  You signed up early for a reason. The private 45-minute 1:1 video sessions with Chris Sembroski
  are now live for the waitlist before anyone else. Only 15 spots total.
</p>
<p style="margin:0 0 16px;">
  Chris went from data engineer to orbiting Earth on Inspiration4. In 45 minutes he gives direct
  answers to your goals and questions while knowing exactly who you are and what you are working on.
  This is the personal clarity engineers, students, and space enthusiasts have been asking for.
</p>
<p style="margin:0 0 8px;color:#fff;font-weight:600;">For the early-access price of $180 you receive:</p>
${valueStackHtml()}
<p style="margin:20px 0 8px;color:#fff;font-weight:600;">Bonuses included:</p>
${bonusesHtml()}
${guaranteeHtml()}
<p style="margin:0 0 16px;">
  15 slots only for early waitlist members. Chris reviews day selections daily. Slots are filling now.
</p>
<p style="margin:0;font-size:13px;color:#c9c6c5;">
  P.S. This early-access window is limited and will not be offered to the public yet.
  Book your slot while it is still available.
</p>
<p style="margin:16px 0 0;font-size:12px;color:#8a8786;">Sent to ${escapeHtml(email)}</p>
  `.trim();

  const text = [
    `Hi ${name},`,
    '',
    'You signed up early for a reason. The private 45-minute 1:1 video sessions with Chris Sembroski are now live for the waitlist before anyone else. Only 15 spots total.',
    '',
    'Chris went from data engineer to orbiting Earth on Inspiration4. In 45 minutes he gives direct answers to your goals and questions while knowing who you are and what you are working on.',
    '',
    'For $180: 45-minute private video call, Chris knows your goals beforehand, AI pre-call brief, post-call actionable brief.',
    'Bonuses: personalized follow-up within 48 hours, call recording (subject to approval), 3 curated resources for your goals.',
    '',
    'Chris Preparation Guarantee: Chris reviews your goals before the call; if not addressed, follow-up resources or priority reschedule at no extra cost.',
    '',
    '15 slots. Chris reviews day selections daily.',
    '',
    `Select Your Day and Request Your Session: ${href}`,
    '',
    'P.S. Early access is limited and not public yet.',
    `Sent to ${email}`,
  ].join('\n');

  return {
    templateId: 'chris-initial-offer',
    subject,
    html: emailShell({
      preheader: 'Only 15 early-access slots · $180 · 45 min with Chris Sembroski',
      title: 'Your early access slot is open',
      bodyHtml,
      ctaLabel: 'Select Your Day and Request Your Session',
      ctaUrl: href,
    }),
    text,
  };
}

/** Branch A — clicked Email 1 CTA, not booked (~day 3) */
export function buildChrisClickedReminderEmail(
  contact: ChrisEarlyWaitlistContact,
): ChrisSequenceEmail {
  const name = displayName(contact.name);
  const email = contact.email.trim();
  const href = ctaHref(contact);
  const subject =
    'You started the process with Chris Sembroski - finish before the remaining slots close';

  const bodyHtml = `
<p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
<p style="margin:0 0 16px;">
  You opened the path to a 45-minute 1:1 with Chris. In that call he answers your goals and questions
  directly — with your background already reviewed.
</p>
<p style="margin:0 0 16px;">
  The AI pre-call brief and post-call brief remove the prep and capture work. You show up ready;
  you leave with next steps.
</p>
<p style="margin:0 0 16px;">
  Only 15 slots for the waitlist, and they are filling.
  Finish your day selection before the remaining seats close.
</p>
<p style="margin:16px 0 0;font-size:12px;color:#8a8786;">Sent to ${escapeHtml(email)}</p>
  `.trim();

  const text = [
    `Hi ${name},`,
    '',
    'You opened the path to a 45-minute 1:1 with Chris. He answers your goals and questions directly, with your background reviewed.',
    'AI pre- and post-call briefs remove prep and capture work.',
    'Early access: $180 · 15 slots · filling now.',
    '',
    `Finish booking: ${href}`,
    `Sent to ${email}`,
  ].join('\n');

  return {
    templateId: 'chris-clicked-reminder',
    subject,
    html: emailShell({
      preheader: 'Finish booking · 15 early-access slots · $180',
      title: 'Finish before the remaining slots close',
      bodyHtml,
      ctaLabel: 'Select Your Day and Request Your Session',
      ctaUrl: href,
    }),
    text,
  };
}

/** Branch B — no click on Email 1 (~day 3) */
export function buildChrisValueNurtureEmail(
  contact: ChrisEarlyWaitlistContact,
): ChrisSequenceEmail {
  const name = displayName(contact.name);
  const email = contact.email.trim();
  const href = ctaHref(contact);
  const subject =
    'What changes when you get direct answers from someone who has been to space';

  const bodyHtml = `
<p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
<p style="margin:0 0 16px;">
  Most career and project advice about space is generic. What changes in a session with Chris is
  specificity: he has been the engineer, the crew member, and the public face of a mission.
  Engineers and students walk away knowing which path matches their goals — and which noise to ignore.
</p>
<p style="margin:0 0 8px;color:#fff;font-weight:600;">For $180 (early access) you get:</p>
${valueStackHtml()}
<p style="margin:20px 0 8px;color:#fff;font-weight:600;">Plus:</p>
${bonusesHtml()}
<p style="margin:16px 0;">
  AI briefs make it effortless: you submit goals and background; Chris reviews them; you get tailored
  questions and a post-call action plan.
</p>
<p style="margin:0 0 16px;">
  Only 15 slots for early waitlist members — before any public offer. Requests are coming in daily.
</p>
<p style="margin:16px 0 0;font-size:12px;color:#8a8786;">Sent to ${escapeHtml(email)}</p>
  `.trim();

  const text = [
    `Hi ${name},`,
    '',
    'Generic space advice is noise. 45 minutes with Chris is specific: he has been the engineer and the crew member. You leave knowing which path fits your goals.',
    '',
    'For $180: 45-min private call, Chris knows your goals, AI pre-brief, post-call brief.',
    'Bonuses: follow-up within 48h, recording (with approval), 3 curated resources.',
    '',
    '15 early-waitlist slots only. Requests coming in daily.',
    '',
    `Book: ${href}`,
    `Sent to ${email}`,
  ].join('\n');

  return {
    templateId: 'chris-value-nurture',
    subject,
    html: emailShell({
      preheader: '45 minutes of direct answers · $180 early access · 15 slots',
      title: 'Direct answers from someone who has been to space',
      bodyHtml,
      ctaLabel: 'Select Your Day and Request Your Session',
      ctaUrl: href,
    }),
    text,
  };
}

/** Final — ~day 7 if still not booked */
export function buildChrisFinalUrgencyEmail(
  contact: ChrisEarlyWaitlistContact,
): ChrisSequenceEmail {
  const name = displayName(contact.name);
  const email = contact.email.trim();
  const href = ctaHref(contact);
  const subject =
    'Last early access chance: 45 minutes with Chris Sembroski - slots closing';

  const bodyHtml = `
<p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
<p style="margin:0 0 16px;">
  This is the last early-access note. Waitlist slots for a private 45-minute 1:1 with Chris Sembroski
  are closing. Once this window ends, this $180 offer is not open to the public yet — and these 15
  seats will not wait.
</p>
<p style="margin:0 0 8px;color:#fff;font-weight:600;">Exactly what you get for $180:</p>
${valueStackHtml()}
<p style="margin:20px 0 8px;color:#fff;font-weight:600;">Full bonus stack:</p>
${bonusesHtml()}
<p style="margin:16px 0;">
  Waiting costs the personal connection and direct answers to <em>your</em> goals — not a generic Q&amp;A.
</p>
${guaranteeHtml()}
<p style="margin:16px 0 0;font-size:12px;color:#8a8786;">Sent to ${escapeHtml(email)}</p>
  `.trim();

  const text = [
    `Hi ${name},`,
    '',
    'Last early-access note. 15 waitlist slots for a 45-minute 1:1 with Chris are closing. $180 is not a public offer yet.',
    '',
    'You get: private video call, Chris reviews your goals, AI pre-brief, post-call brief.',
    'Bonuses: 48h follow-up note, recording (approval), 3 curated resources.',
    'Chris Preparation Guarantee applies.',
    '',
    `Select Your Day and Request Your Session: ${href}`,
    `Sent to ${email}`,
  ].join('\n');

  return {
    templateId: 'chris-final-urgency',
    subject,
    html: emailShell({
      preheader: 'Slots closing · $180 · 45 min with Chris · last early-access note',
      title: 'Last early access chance — slots closing',
      bodyHtml,
      ctaLabel: 'Select Your Day and Request Your Session',
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
