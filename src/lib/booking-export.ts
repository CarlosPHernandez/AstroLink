import 'server-only';

import { bookingDurationMinutes } from '@/lib/calendar-ics';
import { formatSessionWhenUtc } from '@/lib/email/booking-confirmed-templates';
import {
  briefingContentReady,
  formatExpertBriefAsMarkdown,
  formatPreCallBriefAsMarkdown,
  isPreCallBrief,
} from '@/lib/briefing-display';
import { supabaseAdmin } from '@/lib/supabase';
import type { BookingStatus, BriefingPayload, ServiceType, TransactionStatus } from '@/lib/types';
import { formatServiceTypeLabel } from '@/lib/types';

export type TransactionSnapshot = {
  status: TransactionStatus;
  created_at: string;
  gross_amount_cents: number;
};

export type AdminBookingExportContext = {
  id: string;
  status: BookingStatus;
  service_type: ServiceType;
  scheduled_at: string;
  created_at: string;
  duration_minutes: number | null;
  campaign_id: string | null;
  marketing_referrer: string | null;
  match_reason: string | null;
  intake_background: string | null;
  briefing_json: BriefingPayload | null;
  menteeName: string;
  menteeEmail: string;
  mentorName: string;
  transaction: TransactionSnapshot | null;
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending_payment: 'Awaiting payment',
  confirmed: 'Confirmed',
  completed: 'Completed',
  pending_review: 'Under review',
  payment_failed: 'Payment failed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

/** Pick the best transaction row when Supabase returns a one-to-many array. */
export function resolvePrimaryTransaction(
  rows: TransactionSnapshot[],
): TransactionSnapshot | null {
  if (rows.length === 0) {
    return null;
  }

  const completed = [...rows]
    .filter((row) => row.status === 'completed')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (completed[0]) {
    return completed[0];
  }

  return (
    [...rows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0] ?? null
  );
}

export function shouldWarnOps(status: BookingStatus): boolean {
  return (
    status === 'pending_payment' ||
    status === 'payment_failed' ||
    status === 'cancelled' ||
    status === 'refunded' ||
    status === 'pending_review'
  );
}

export function formatPaymentSummary(
  ctx: Pick<AdminBookingExportContext, 'status' | 'transaction'>,
): { label: string; note: string } {
  const { status, transaction } = ctx;

  if (status === 'pending_payment') {
    return { label: 'Awaiting payment', note: 'Payment has not been collected.' };
  }
  if (status === 'payment_failed') {
    return { label: 'Payment failed', note: 'Do not treat this session as confirmed.' };
  }
  if (status === 'cancelled') {
    return { label: 'Cancelled', note: 'This booking was cancelled.' };
  }
  if (status === 'refunded') {
    return { label: 'Refunded', note: 'This booking was refunded.' };
  }
  if (status === 'pending_review') {
    return { label: 'Under review', note: 'Verify payment before briefing the expert.' };
  }

  if (status === 'confirmed' || status === 'completed') {
    if (!transaction) {
      return {
        label: 'Confirmed (no ledger row)',
        note: 'Likely dev/skip-payments path — verify before briefing.',
      };
    }
    if (transaction.status === 'completed') {
      return { label: 'Payment confirmed', note: 'Ledger status: completed.' };
    }
    return {
      label: 'Confirmed (ledger pending)',
      note: `Ledger status: ${transaction.status}.`,
    };
  }

  return { label: BOOKING_STATUS_LABELS[status], note: '' };
}

export function resolveBriefExportStatus(
  ctx: Pick<AdminBookingExportContext, 'status' | 'briefing_json'>,
): { label: string; message: string; ready: boolean } {
  const { status, briefing_json: briefing } = ctx;

  if (status === 'pending_payment' || status === 'payment_failed') {
    return {
      label: 'Not generated',
      message: 'Brief was not generated because payment is not confirmed.',
      ready: false,
    };
  }

  if (!briefing) {
    return {
      label: 'Missing',
      message:
        'Brief is missing — generation may have failed. Regenerate via POST /api/book/briefing when payment is confirmed.',
      ready: false,
    };
  }

  if (isPreCallBrief(briefing)) {
    return { label: 'Ready', message: '', ready: true };
  }

  if (briefingContentReady(briefing, 'mentor')) {
    return { label: 'Ready', message: '', ready: true };
  }

  return {
    label: 'Unreadable',
    message: 'Brief payload is present but not in a recognized expert format.',
    ready: false,
  };
}

function formatWarningBanner(status: BookingStatus): string {
  if (status === 'pending_payment' || status === 'payment_failed') {
    return [
      '## ⚠️ Payment not confirmed',
      '',
      'This booking is **not** confirmed for session prep. Do not brief the expert as if the session is locked in.',
      '',
    ].join('\n');
  }

  if (status === 'cancelled' || status === 'refunded') {
    return [
      `## ⚠️ Session ${BOOKING_STATUS_LABELS[status].toLowerCase()}`,
      '',
      `This booking is **${BOOKING_STATUS_LABELS[status].toLowerCase()}**. Do not brief the expert as an upcoming session.`,
      '',
    ].join('\n');
  }

  if (status === 'pending_review') {
    return [
      '## ⚠️ Under review',
      '',
      'Verify payment and booking status before briefing the expert.',
      '',
    ].join('\n');
  }

  return '';
}

export function formatBookingExportMarkdown(
  ctx: AdminBookingExportContext,
  options?: { includeEmail?: boolean; exportedAt?: string },
): string {
  const includeEmail = options?.includeEmail !== false;
  const exportedAt = options?.exportedAt ?? new Date().toISOString();
  const payment = formatPaymentSummary(ctx);
  const briefStatus = resolveBriefExportStatus(ctx);
  const duration = ctx.duration_minutes ?? bookingDurationMinutes(ctx.service_type);
  const warning = shouldWarnOps(ctx.status) ? formatWarningBanner(ctx.status) : '';

  const lines: string[] = [
    '# AstroLink session brief — INTERNAL',
    '',
    `> Generated: ${formatSessionWhenUtc(exportedAt)}`,
    `> Payment: ${payment.label}${payment.note ? ` — ${payment.note}` : ''}`,
    '',
    '---',
    '',
    '## Session',
    '',
    `- **Booking ID:** ${ctx.id}`,
    `- **Expert:** ${ctx.mentorName}`,
    `- **Buyer:** ${ctx.menteeName}`,
  ];

  if (includeEmail) {
    lines.push(`- **Buyer email:** ${ctx.menteeEmail}`);
  }

  lines.push(
    `- **When:** ${formatSessionWhenUtc(ctx.scheduled_at)}`,
    `- **Duration:** ${duration} min`,
    `- **Service:** ${formatServiceTypeLabel(ctx.service_type, duration)}`,
    `- **Booking status:** ${BOOKING_STATUS_LABELS[ctx.status]}`,
    `- **Booked:** ${formatSessionWhenUtc(ctx.created_at)}`,
  );

  if (ctx.campaign_id) {
    lines.push(`- **Campaign:** ${ctx.campaign_id}`);
  }
  if (ctx.marketing_referrer?.trim()) {
    lines.push(`- **Referrer:** ${ctx.marketing_referrer.trim()}`);
  }

  if (warning) {
    lines.push('', '---', '', warning);
  }

  lines.push(
    '',
    '---',
    '',
    '## What the buyer submitted',
    '',
    '### Goals & questions',
    ctx.match_reason?.trim() || '(none submitted)',
    '',
    '### Background',
    ctx.intake_background?.trim() || '(none submitted)',
    '',
    '---',
    '',
    `## AI prep brief (${briefStatus.label})`,
    '',
  );

  if (briefStatus.ready && ctx.briefing_json) {
    if (isPreCallBrief(ctx.briefing_json)) {
      lines.push(formatPreCallBriefAsMarkdown(ctx.briefing_json));
    } else {
      lines.push(formatExpertBriefAsMarkdown(ctx.briefing_json));
    }
  } else {
    lines.push(briefStatus.message);
  }

  lines.push(
    '',
    '---',
    '',
    '## Internal notes',
    '',
    `- Payment ledger: ${ctx.transaction?.status ?? 'no transaction row'}`,
    `- Transaction completed at: ${
      ctx.transaction ? formatSessionWhenUtc(ctx.transaction.created_at) : '—'
    }`,
    '- Brief generated: unknown — no timestamp stored',
  );

  return lines.join('\n');
}

export function buildBookingExportFilename(ctx: AdminBookingExportContext): string {
  const datePart = ctx.scheduled_at.slice(0, 10);
  const idPrefix = ctx.id.slice(0, 8);
  return `astrolink-booking-brief-${idPrefix}-${datePart}.md`;
}

type BookingExportRow = {
  id: string;
  status: string;
  service_type: string;
  scheduled_at: string;
  created_at: string;
  duration_minutes: number | null;
  campaign_id: string | null;
  marketing_referrer: string | null;
  match_reason: string | null;
  intake_background: string | null;
  briefing_json: unknown;
  users: { full_name: string; email: string } | null;
  mentors: { full_name: string } | null;
  transactions: TransactionSnapshot[] | null;
};

export async function fetchAdminBookingExportContext(
  bookingId: string,
): Promise<AdminBookingExportContext | null> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(
      `id, status, service_type, scheduled_at, created_at, duration_minutes,
       campaign_id, marketing_referrer, match_reason, intake_background, briefing_json,
       users!bookings_mentee_id_fkey(full_name, email),
       mentors(full_name),
       transactions(status, created_at, gross_amount_cents)`,
    )
    .eq('id', bookingId)
    .single();

  const row = data as BookingExportRow | null;

  if (error || !row) {
    return null;
  }

  const txRows = row.transactions ?? [];

  return {
    id: row.id,
    status: row.status as BookingStatus,
    service_type: row.service_type as ServiceType,
    scheduled_at: row.scheduled_at,
    created_at: row.created_at,
    duration_minutes: row.duration_minutes,
    campaign_id: row.campaign_id,
    marketing_referrer: row.marketing_referrer,
    match_reason: row.match_reason,
    intake_background: row.intake_background,
    briefing_json: (row.briefing_json as BriefingPayload | null) ?? null,
    menteeName: row.users?.full_name?.trim() || 'Buyer',
    menteeEmail: row.users?.email?.trim() || '(no email on file)',
    mentorName: row.mentors?.full_name?.trim() || 'Expert',
    transaction: resolvePrimaryTransaction(txRows),
  };
}