import 'server-only';

import { getAppBaseUrl } from '@/lib/app-url';
import { getMentorPrepDashboardPath, getPostBookingDashboardPath } from '@/lib/dashboard-paths';
import { bookingDurationMinutes, buildBookingIcs } from '@/lib/calendar-ics';
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
  menteeName: string;
  menteeEmail: string;
  mentorName: string;
  mentorEmail: string;
};

export function buildMenteeConfirmationEmail(ctx: BookingEmailContext): {
  subject: string;
  html: string;
  attachment: { filename: string; content: string };
} {
  const baseUrl = getAppBaseUrl();
  const dashboardUrl = `${baseUrl}${getPostBookingDashboardPath('mentee', ctx.bookingId)}`;
  const sessionUrl = ctx.dailyRoomUrl ? `${baseUrl}/session/${ctx.bookingId}` : null;
  const serviceLabel = SERVICE_TYPE_LABELS[ctx.serviceType] ?? ctx.serviceType;
  const when = formatSessionWhenUtc(ctx.scheduledAt);
  const goals = ctx.matchReason?.trim() || 'Your session goals are saved in your dashboard.';

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