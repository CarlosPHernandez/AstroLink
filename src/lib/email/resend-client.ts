import 'server-only';

import { Resend } from 'resend';

import { getResendApiKey, getResendFrom, isNotificationsDisabled } from '@/lib/email/notification-env';

export type SendEmailAttachment = {
  filename: string;
  content: string;
};

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  attachments?: SendEmailAttachment[];
};

export type SendEmailResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string }
  | { skipped: true; reason: 'disabled' | 'missing_api_key' };

export type EmailSender = (params: SendEmailParams) => Promise<SendEmailResult>;

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (isNotificationsDisabled()) {
    return { skipped: true, reason: 'disabled' };
  }

  const apiKey = getResendApiKey();
  if (!apiKey) {
    return { skipped: true, reason: 'missing_api_key' };
  }

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: getResendFrom(),
      to: params.to,
      subject: params.subject,
      html: params.html,
      attachments: params.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: Buffer.from(attachment.content, 'utf8').toString('base64'),
      })),
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    const messageId = data?.id;
    if (!messageId) {
      return { ok: false, error: 'Resend returned no message id' };
    }

    return { ok: true, messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Resend send failed';
    return { ok: false, error: message };
  }
}