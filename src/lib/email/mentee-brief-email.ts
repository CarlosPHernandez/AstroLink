import 'server-only';

import { formatMenteeBriefAsPlainText } from '@/lib/briefing-display';
import type { BriefingPayload } from '@/lib/briefing-display';
import { formatSessionWhenUtc } from '@/lib/email/booking-confirmed-templates';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildMenteeBriefEmail(params: {
  menteeName: string;
  mentorName: string;
  scheduledAt: string;
  briefing: BriefingPayload;
}): { subject: string; html: string; text: string } {
  const when = formatSessionWhenUtc(params.scheduledAt);
  const plainBrief = formatMenteeBriefAsPlainText(params.briefing);
  const htmlBrief = escapeHtml(plainBrief).replace(/\n/g, '<br/>');

  const html = `
    <p>Hi ${escapeHtml(params.menteeName)},</p>
    <p>Here is your pre-call brief for your session with <strong>${escapeHtml(params.mentorName)}</strong> on ${escapeHtml(when)}.</p>
    <hr/>
    <div style="font-family: ui-monospace, monospace; font-size: 13px; line-height: 1.5; white-space: pre-wrap;">${htmlBrief}</div>
    <hr/>
    <p>— AstroLink</p>
  `.trim();

  const text = [
    `Hi ${params.menteeName},`,
    '',
    `Here is your pre-call brief for your session with ${params.mentorName} on ${when}.`,
    '',
    plainBrief,
    '',
    '— AstroLink',
  ].join('\n');

  return {
    subject: `Your pre-call brief — ${params.mentorName}`,
    html,
    text,
  };
}