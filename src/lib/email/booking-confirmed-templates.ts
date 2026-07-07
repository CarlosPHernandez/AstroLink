import 'server-only';

import { getAppBaseUrl } from '@/lib/app-url';
import { getMentorPrepDashboardPath, getPostBookingDashboardPath } from '@/lib/dashboard-paths';
import { bookingDurationMinutes, buildBookingIcs } from '@/lib/calendar-ics';
import { getChrisCampaignId } from '@/lib/chris-campaign/chris-campaign-config';
import { CHRIS_SESSION_DURATION_MINUTES } from '@/lib/chris-campaign/chris-campaign-constants';
import { resolveMentorBriefTeaser } from '@/lib/notification-brief-teaser';
import { SERVICE_TYPE_LABELS, type ServiceType } from '@/lib/types';

const UTC_DISCLAIMER =
  'Times shown in UTC. Add the attached calendar file to see this in your local timezone.';

export function formatSessionWhenUtc(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatSessionDateUtc(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildIcsAttachment(params: {
  bookingId: string;
  scheduledAt: string;
  serviceType: ServiceType;
  title: string;
  description: string;
  url: string;
}): { filename: string; content: string } {
  const ics = buildBookingIcs({
    uid: `${params.bookingId}@astrolink.ai`,
    scheduledAt: params.scheduledAt,
    durationMinutes: bookingDurationMinutes(params.serviceType),
    title: params.title,
    description: params.description,
    url: params.url,
  });
  return { filename: 'astrolink-session.ics', content: ics };
}

export type BookingEmailContext = {
  bookingId: string;
  scheduledAt: string;
  serviceType: ServiceType;
  matchReason: string | null;
  briefingJson: unknown;
  dailyRoomUrl: string | null;
  campaignId?: string | null;
  durationMinutes?: number | null;
  menteeName: string;
  menteeEmail: string;
  mentorName: string;
  mentorEmail: string;
};

export function buildMenteeConfirmationEmail(ctx: BookingEmailContext): {
  subject: string;
  html: string;
  attachment?: { filename: string; content: string };
} {
  const baseUrl = getAppBaseUrl();
  const dashboardUrl = `${baseUrl}${getPostBookingDashboardPath('mentee', ctx.bookingId)}`;
  const sessionUrl = ctx.dailyRoomUrl ? `${baseUrl}/session/${ctx.bookingId}` : null;
  const serviceLabel = SERVICE_TYPE_LABELS[ctx.serviceType] ?? ctx.serviceType;
  const when = formatSessionWhenUtc(ctx.scheduledAt);
  const goals = ctx.matchReason?.trim() || 'Your session goals are saved in your dashboard.';
  const isChrisCampaign = ctx.campaignId === getChrisCampaignId();

  if (isChrisCampaign) {
    const dateOnly = formatSessionDateUtc(ctx.scheduledAt);
    const durationMinutes = ctx.durationMinutes ?? CHRIS_SESSION_DURATION_MINUTES;
    const chrisPortraitUrl = `${baseUrl}/chris_sembroski.webp`;
    const html = `
      <div style="margin:0;padding:0;background:#1c1c1c;color:#ffffff;font-family:Geist,Inter,Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#1c1c1c;">
          <tr>
            <td align="center" style="padding:32px 16px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:collapse;background:#1c1c1c;border:1px solid #333333;box-shadow:0 25px 50px rgba(0,0,0,0.45);">
                <tr>
                  <td style="padding:18px 24px;border-bottom:1px solid #333333;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">
                    AstroLink
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 24px 10px;">
                    <div style="font-size:11px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:#b4c5ff;">Admit One</div>
                    <h1 style="margin:10px 0 8px;color:#ffffff;font-size:28px;line-height:1.1;font-weight:600;letter-spacing:0;">You're booked with ${escapeHtml(ctx.mentorName)}</h1>
                    <p style="margin:0;color:#c9c6c5;font-size:14px;line-height:1.5;font-weight:300;">Hi ${escapeHtml(ctx.menteeName)}, your Chris campaign date is reserved.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 24px 8px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#111111;border:1px solid #333333;">
                      <tr>
                        <td style="padding:16px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                            <tr>
                              <td style="width:86px;padding-right:16px;vertical-align:top;">
                                <img src="${escapeHtml(chrisPortraitUrl)}" width="72" height="72" alt="${escapeHtml(ctx.mentorName)}" style="display:block;width:72px;height:72px;border-radius:16px;object-fit:cover;border:1px solid #333333;" />
                              </td>
                              <td style="vertical-align:middle;">
                                <div style="font-size:17px;line-height:1.25;font-weight:600;color:#ffffff;letter-spacing:0;">${escapeHtml(ctx.mentorName)}</div>
                                <div style="margin-top:4px;font-size:13px;line-height:1.45;color:#c9c6c5;font-weight:300;">Inspiration4 astronaut</div>
                                <div style="margin-top:10px;display:inline-block;background:#00174c;color:#b4c5ff;border:1px solid #334b84;border-radius:999px;padding:5px 10px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Date reserved</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-top:1px solid #333333;border-bottom:1px solid #333333;">
                      <tr>
                        <td style="padding:14px 0;width:38%;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#c9c6c5;">When</td>
                        <td style="padding:14px 0;color:#ffffff;font-size:16px;font-weight:700;">${escapeHtml(dateOnly)}</td>
                      </tr>
                      <tr>
                        <td style="padding:14px 0;border-top:1px solid #333333;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#c9c6c5;">Service</td>
                        <td style="padding:14px 0;border-top:1px solid #333333;color:#ffffff;font-size:16px;font-weight:700;">${durationMinutes}-minute session with ${escapeHtml(ctx.mentorName)}</td>
                      </tr>
                      <tr>
                        <td style="padding:14px 0;border-top:1px solid #333333;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#c9c6c5;">Goals</td>
                        <td style="padding:14px 0;border-top:1px solid #333333;color:#e5e2e1;font-size:14px;line-height:1.5;font-weight:300;">${escapeHtml(goals)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 24px 20px;">
                    <p style="margin:0 0 18px;color:#c9c6c5;font-size:14px;line-height:1.6;font-weight:300;">You reserved this date. You'll be able to select a time once Chris confirms availability for that day. If no time is available, we'll help reschedule.</p>
                    <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background:#ffffff;color:#1c1c1c;text-decoration:none;border-radius:8px;padding:12px 18px;font-size:14px;font-weight:700;letter-spacing:0;">View your dashboard</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 24px;border-top:1px dashed #333333;color:#c9c6c5;font-size:12px;font-weight:300;">
                    This is your confirmation ticket for the Chris campaign date hold.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `.trim();

    return {
      subject: `You're booked with ${ctx.mentorName}`,
      html,
    };
  }

  const joinBlock = sessionUrl
    ? `<p><a href="${escapeHtml(sessionUrl)}">Join session</a> (opens when your session window is active)</p>`
    : '';

  const html = `
    <p>Hi ${escapeHtml(ctx.menteeName)},</p>
    <p>You're booked with <strong>${escapeHtml(ctx.mentorName)}</strong>.</p>
    <p><strong>When:</strong> ${escapeHtml(when)}<br/>
    <strong>Service:</strong> ${escapeHtml(serviceLabel)}</p>
    <p><strong>Your goals:</strong> ${escapeHtml(goals)}</p>
    <p>${UTC_DISCLAIMER}</p>
    <p><a href="${escapeHtml(dashboardUrl)}">View your dashboard</a></p>
    ${joinBlock}
    <p>— AstroLink</p>
  `.trim();

  const attachment = buildIcsAttachment({
    bookingId: ctx.bookingId,
    scheduledAt: ctx.scheduledAt,
    serviceType: ctx.serviceType,
    title: `AstroLink session with ${ctx.mentorName}`,
    description: goals,
    url: dashboardUrl,
  });

  return {
    subject: `You're booked with ${ctx.mentorName}`,
    html,
    attachment,
  };
}

export function buildMentorConfirmationEmail(ctx: BookingEmailContext): {
  subject: string;
  html: string;
  attachment: { filename: string; content: string };
} {
  const baseUrl = getAppBaseUrl();
  const prepUrl = `${baseUrl}${getMentorPrepDashboardPath(ctx.bookingId)}`;
  const serviceLabel = SERVICE_TYPE_LABELS[ctx.serviceType] ?? ctx.serviceType;
  const when = formatSessionWhenUtc(ctx.scheduledAt);
  const goals = ctx.matchReason?.trim() || 'No goals recorded yet.';
  const teaser = resolveMentorBriefTeaser(
    ctx.briefingJson as Parameters<typeof resolveMentorBriefTeaser>[0],
  );
  const teaserBlock = teaser
    ? `<p><strong>Prep focus:</strong> ${escapeHtml(teaser)}</p>`
    : '';

  const html = `
    <p>Hi ${escapeHtml(ctx.mentorName)},</p>
    <p><strong>${escapeHtml(ctx.menteeName)}</strong> booked a session with you.</p>
    <p><strong>When:</strong> ${escapeHtml(when)}<br/>
    <strong>Service:</strong> ${escapeHtml(serviceLabel)}</p>
    <p><strong>Buyer goals:</strong> ${escapeHtml(goals)}</p>
    ${teaserBlock}
    <p>${UTC_DISCLAIMER}</p>
    <p><a href="${escapeHtml(prepUrl)}">View session prep</a></p>
    <p>— AstroLink</p>
  `.trim();

  const attachment = buildIcsAttachment({
    bookingId: ctx.bookingId,
    scheduledAt: ctx.scheduledAt,
    serviceType: ctx.serviceType,
    title: `AstroLink session with ${ctx.menteeName}`,
    description: goals,
    url: prepUrl,
  });

  return {
    subject: `New session with ${ctx.menteeName}`,
    html,
    attachment,
  };
}
