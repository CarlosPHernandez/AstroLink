import 'server-only';

import {
  pathAssessmentBookingUrl,
  pathAssessmentWrittenReviewViewUrl,
} from '@/lib/path-assessment/public-url.server';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildWrittenReviewPaidBuyerEmail(params: {
  buyerName: string;
  mentorName: string;
  slaDays: number;
}): { subject: string; html: string } {
  const name = params.buyerName.trim() || 'there';
  return {
    subject: `Payment received — written review from ${params.mentorName}`,
    html: `
<p>Hi ${escapeHtml(name)},</p>
<p>Thanks for ordering a written expert review of your Space Path Assessment.</p>
<p><strong>${escapeHtml(params.mentorName)}</strong> will review your report and reply in writing within about <strong>${params.slaDays} business days</strong>.</p>
<p>We'll email you when it's ready.</p>
<p>— AstroLink</p>
`.trim(),
  };
}

export function buildWrittenReviewNewMentorEmail(params: {
  mentorName: string;
  buyerName: string;
  dueAtLabel: string;
  dashboardHint: string;
}): { subject: string; html: string } {
  return {
    subject: `New written report review · due ${params.dueAtLabel}`,
    html: `
<p>Hi ${escapeHtml(params.mentorName)},</p>
<p>You have a new <strong>written Space Path Assessment review</strong> from <strong>${escapeHtml(params.buyerName)}</strong>.</p>
<p>Due by: <strong>${escapeHtml(params.dueAtLabel)}</strong></p>
<p>${escapeHtml(params.dashboardHint)}</p>
<p>— AstroLink</p>
`.trim(),
  };
}

export function buildWrittenReviewDeliveredBuyerEmail(params: {
  buyerName: string;
  mentorName: string;
  reviewToken: string;
  assessmentToken: string;
  writtenResponse: string;
}): { subject: string; html: string } {
  const name = params.buyerName.trim() || 'there';
  const viewUrl = pathAssessmentWrittenReviewViewUrl(params.reviewToken);
  const bookingUrl = pathAssessmentBookingUrl(params.assessmentToken);
  const body = escapeHtml(params.writtenResponse).replace(/\n/g, '<br/>');

  return {
    subject: `Your written expert review from ${params.mentorName} is ready`,
    html: `
<p>Hi ${escapeHtml(name)},</p>
<p><strong>${escapeHtml(params.mentorName)}</strong> reviewed your Space Path Assessment. Full write-up:</p>
<hr/>
<div style="font-size:14px;line-height:1.55;color:#171A1F;">${body}</div>
<hr/>
<p><a href="${escapeHtml(viewUrl)}">View on AstroLink</a></p>
<p style="margin-top:24px;"><strong>Want to go deeper live?</strong> Book a 1:1 with your assessment already attached.</p>
<p><a href="${escapeHtml(bookingUrl)}" style="display:inline-block;padding:12px 18px;background:#0E1420;color:#fff;text-decoration:none;border-radius:999px;font-weight:600;">Book live expert review</a></p>
<p>— AstroLink</p>
`.trim(),
  };
}
