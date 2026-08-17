import 'server-only';

import {
  pathAssessmentBookingUrl,
  pathAssessmentResultsUrl,
  pathAssessmentWrittenReviewUrl,
} from '@/lib/path-assessment/public-url.server';
import { renderPathAssessmentReportHtml } from '@/lib/path-assessment/render-report';
import type { PathAssessmentReport } from '@/lib/path-assessment/schema';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildPathAssessmentEmail(params: {
  firstName: string;
  token: string;
  report: PathAssessmentReport;
  mentorName?: string | null;
  mentorSlug?: string | null;
}): { subject: string; html: string } {
  const resultsUrl = pathAssessmentResultsUrl(params.token);
  const bookingUrl = pathAssessmentBookingUrl(params.token, params.mentorSlug);
  const writtenReviewUrl = pathAssessmentWrittenReviewUrl(params.token);
  const reportHtml = renderPathAssessmentReportHtml(params.report, {
    firstName: params.firstName,
    mentorName: params.mentorName ?? undefined,
    bookingUrl,
    writtenReviewUrl,
    includeLiveCta: true,
    includeWrittenCta: true,
  });
  const name = params.firstName.trim() || 'there';

  const subject = `${name}, your Space Path Assessment is ready`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#F7F8FA;font-family:Montserrat,Helvetica,Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:28px 16px 40px;">
    <p style="margin:0 0 16px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#66717F;">AstroLink · Space Path Assessment</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#171A1F;">Hi ${escapeHtml(name)}, your free readiness report is below. You can also open it anytime:</p>
    <p style="margin:0 0 24px;"><a href="${escapeHtml(resultsUrl)}" style="color:#1859D4;font-size:14px;">View full report on AstroLink</a></p>
    ${reportHtml}
    <p style="margin:32px 0 0;font-size:12px;line-height:1.5;color:#9AA3AE;">
      You’re receiving this because you completed the free Space Path Assessment on AstroLink.
      No account was required. Primary next step: book a live expert review with your report attached.
      Optional: written expert review for $50.
    </p>
  </div>
</body>
</html>
`.trim();

  return { subject, html };
}
