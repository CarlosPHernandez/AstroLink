import 'server-only';

import { getAppBaseUrl } from '@/lib/app-url';
import { sendEmail } from '@/lib/email/resend-client';
import {
  buildVideoWatchPath,
  createVideoAccessTokenPayload,
  signVideoAccessToken,
} from '@/lib/video-requests/access-token';
import { VIDEO_REQUEST_OCCASION_LABELS, type VideoRequestOccasion } from '@/lib/video-requests/types';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function occasionLabel(occasion: string): string {
  if (occasion in VIDEO_REQUEST_OCCASION_LABELS) {
    return VIDEO_REQUEST_OCCASION_LABELS[occasion as VideoRequestOccasion];
  }
  return occasion;
}

export async function sendVideoRequestConfirmationEmail(params: {
  buyerEmail: string;
  expertName: string;
  priceCents: number;
  dueAt: string | null;
  occasion: string;
}): Promise<void> {
  const due =
    params.dueAt != null
      ? new Date(params.dueAt).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          timeZone: 'America/New_York',
        })
      : 'about 7 days';
  const dollars = (params.priceCents / 100).toFixed(0);
  await sendEmail({
    to: params.buyerEmail,
    subject: `You're set — video from ${params.expertName}`,
    html: `
      <p>Thanks for requesting a personal video from <strong>${escapeHtml(params.expertName)}</strong>.</p>
      <p>Occasion: ${escapeHtml(occasionLabel(params.occasion))}<br/>
      Amount: $${dollars}<br/>
      Usually ready by: ${escapeHtml(due)}</p>
      <p>We'll email you a private link when the video is ready. No account needed.</p>
    `,
  });
}

export async function sendVideoRequestDeliveredEmail(params: {
  buyerEmail: string;
  expertName: string;
  videoRequestId: string;
}): Promise<void> {
  const token = signVideoAccessToken(
    createVideoAccessTokenPayload({
      videoRequestId: params.videoRequestId,
      email: params.buyerEmail,
    }),
  );
  const url = `${getAppBaseUrl()}${buildVideoWatchPath(token)}`;
  await sendEmail({
    to: params.buyerEmail,
    subject: `Your video from ${params.expertName} is ready`,
    html: `
      <p><strong>${escapeHtml(params.expertName)}</strong> recorded a personal video for you.</p>
      <p><a href="${escapeHtml(url)}">Watch your video</a></p>
      <p>This link is private — keep it to yourself.</p>
    `,
  });
}

export async function sendVideoRequestRefundEmail(params: {
  buyerEmail: string;
  expertName: string;
  reason: 'declined' | 'expired';
}): Promise<void> {
  const line =
    params.reason === 'declined'
      ? `${params.expertName} couldn't take this request.`
      : `We couldn't deliver a video from ${params.expertName} in time.`;
  await sendEmail({
    to: params.buyerEmail,
    subject: `Refund for your video request`,
    html: `
      <p>${escapeHtml(line)}</p>
      <p>Your payment will be refunded in full. It can take a few business days to appear on your statement.</p>
    `,
  });
}

export async function sendMentorNewVideoRequestEmail(params: {
  mentorEmail: string;
  fromName: string;
  occasion: string;
  dueAt: string | null;
}): Promise<void> {
  const due =
    params.dueAt != null
      ? new Date(params.dueAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          timeZone: 'America/New_York',
        })
      : 'soon';
  await sendEmail({
    to: params.mentorEmail,
    subject: `New personal video request · due ${due}`,
    html: `
      <p>You have a new personal video request from <strong>${escapeHtml(params.fromName)}</strong>.</p>
      <p>Occasion: ${escapeHtml(occasionLabel(params.occasion))}<br/>Due: ${escapeHtml(due)}</p>
      <p>Open your mentor dashboard → Video requests to record and deliver.</p>
    `,
  });
}
