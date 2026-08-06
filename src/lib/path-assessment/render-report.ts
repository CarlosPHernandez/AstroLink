import type { PathAssessmentReport } from '@/lib/path-assessment/schema';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 12px;line-height:1.55;color:#171A1F;">${escapeHtml(text)}</p>`;
}

function sectionTitle(text: string): string {
  return `<h2 style="margin:24px 0 10px;font-size:15px;font-weight:600;letter-spacing:0.02em;text-transform:uppercase;color:#66717F;">${escapeHtml(text)}</h2>`;
}

/**
 * Safe HTML from structured report JSON (escaped). Used for email + optional storage.
 * PR-A: live CTA only — no $50 written review CTA.
 */
export function renderPathAssessmentReportHtml(
  report: PathAssessmentReport,
  options?: {
    firstName?: string;
    bookingUrl?: string;
    includeLiveCta?: boolean;
  },
): string {
  const includeLiveCta = options?.includeLiveCta !== false;
  const bookingUrl = options?.bookingUrl?.trim() || '';
  const firstName = options?.firstName?.trim();

  const gaps = report.key_gaps
    .map(
      (gap) =>
        `<li style="margin:0 0 10px;"><strong style="color:#171A1F;">${escapeHtml(gap.title)}</strong><br/><span style="color:#66717F;line-height:1.5;">${escapeHtml(gap.detail)}</span></li>`,
    )
    .join('');

  const focus = report.focus_areas
    .map(
      (area) =>
        `<li style="margin:0 0 6px;color:#171A1F;">${escapeHtml(area)}</li>`,
    )
    .join('');

  const actions = report.next_actions
    .map(
      (item, index) =>
        `<li style="margin:0 0 12px;"><strong style="color:#171A1F;">${index + 1}. ${escapeHtml(item.action)}</strong><br/><span style="color:#66717F;line-height:1.5;">${escapeHtml(item.why)}</span></li>`,
    )
    .join('');

  const greeting = firstName
    ? `<p style="margin:0 0 8px;color:#66717F;font-size:14px;">For ${escapeHtml(firstName)}</p>`
    : '';

  const liveCta =
    includeLiveCta && bookingUrl
      ? `
    <div style="margin:28px 0 0;padding:20px;border:1px solid #DDE2EA;border-radius:8px;background:#F7F8FA;">
      <p style="margin:0 0 8px;font-weight:600;color:#171A1F;line-height:1.4;">Want a verified expert to review this report with you live?</p>
      <p style="margin:0 0 16px;color:#66717F;font-size:14px;line-height:1.5;">We'll load your assessment so they can prepare specific advice for your situation.</p>
      <p style="margin:0 0 12px;color:#171A1F;font-size:14px;line-height:1.5;">${escapeHtml(report.upsell_bridge_live)}</p>
      <a href="${escapeHtml(bookingUrl)}" style="display:inline-block;padding:12px 18px;background:#0E1420;color:#FFFFFF;text-decoration:none;border-radius:999px;font-size:14px;font-weight:600;">Book live expert review with my report</a>
    </div>`
      : includeLiveCta
        ? `
    <div style="margin:28px 0 0;padding:20px;border:1px solid #DDE2EA;border-radius:8px;background:#F7F8FA;">
      <p style="margin:0;color:#171A1F;line-height:1.5;">${escapeHtml(report.upsell_bridge_live)}</p>
    </div>`
        : '';

  return `
<div style="font-family:Montserrat,Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto;color:#171A1F;">
  ${greeting}
  <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;font-weight:600;color:#171A1F;">${escapeHtml(report.headline)}</h1>
  ${paragraph(report.standing_summary)}
  ${sectionTitle('Key gaps')}
  <ul style="margin:0;padding-left:18px;">${gaps}</ul>
  ${sectionTitle('Focus areas')}
  <ul style="margin:0;padding-left:18px;">${focus}</ul>
  ${sectionTitle('Best expert conversation')}
  ${paragraph(report.expert_conversation_type)}
  ${sectionTitle('Next actions')}
  <ol style="margin:0;padding-left:18px;">${actions}</ol>
  ${liveCta}
</div>
`.trim();
}

/** Normalize possibly-partial LLM output into a full report shape (safe for render). */
export function coercePathAssessmentReport(
  raw: unknown,
  fallback: PathAssessmentReport,
): PathAssessmentReport {
  if (!raw || typeof raw !== 'object') {
    return fallback;
  }
  const obj = raw as Record<string, unknown>;

  const keyGaps = Array.isArray(obj.key_gaps)
    ? obj.key_gaps
        .filter(
          (g): g is { title: string; detail: string } =>
            !!g &&
            typeof g === 'object' &&
            typeof (g as { title?: unknown }).title === 'string' &&
            typeof (g as { detail?: unknown }).detail === 'string',
        )
        .slice(0, 4)
    : [];

  const nextActions = Array.isArray(obj.next_actions)
    ? obj.next_actions
        .filter(
          (a): a is { action: string; why: string } =>
            !!a &&
            typeof a === 'object' &&
            typeof (a as { action?: unknown }).action === 'string' &&
            typeof (a as { why?: unknown }).why === 'string',
        )
        .slice(0, 5)
    : [];

  const focusAreas = Array.isArray(obj.focus_areas)
    ? obj.focus_areas.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, 6)
    : [];

  return {
    headline:
      typeof obj.headline === 'string' && obj.headline.trim()
        ? obj.headline.trim()
        : fallback.headline,
    standing_summary:
      typeof obj.standing_summary === 'string' && obj.standing_summary.trim()
        ? obj.standing_summary.trim()
        : fallback.standing_summary,
    key_gaps: keyGaps.length >= 1 ? keyGaps : fallback.key_gaps,
    focus_areas: focusAreas.length >= 1 ? focusAreas : fallback.focus_areas,
    expert_conversation_type:
      typeof obj.expert_conversation_type === 'string' && obj.expert_conversation_type.trim()
        ? obj.expert_conversation_type.trim()
        : fallback.expert_conversation_type,
    next_actions: nextActions.length >= 1 ? nextActions : fallback.next_actions,
    upsell_bridge_live:
      typeof obj.upsell_bridge_live === 'string' && obj.upsell_bridge_live.trim()
        ? obj.upsell_bridge_live.trim()
        : fallback.upsell_bridge_live,
    upsell_bridge_written:
      typeof obj.upsell_bridge_written === 'string' && obj.upsell_bridge_written.trim()
        ? obj.upsell_bridge_written.trim()
        : fallback.upsell_bridge_written,
  };
}
