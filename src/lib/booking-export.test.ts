import { describe, expect, it } from 'vitest';
import type { AdminBookingExportContext } from '@/lib/booking-export';
import {
  buildBookingExportFilename,
  formatBookingExportMarkdown,
  formatPaymentSummary,
  resolveBriefExportStatus,
  resolvePrimaryTransaction,
  shouldWarnOps,
} from '@/lib/booking-export';
import type { SessionBriefingBundle } from '@/lib/types';

const sessionBundle: SessionBriefingBundle = {
  version: 2,
  mentee: {
    personal_intro: 'Intro',
    session_objectives: ['Objective'],
    recommended_agenda: {
      minutes_0_5: 'A',
      minutes_5_20: 'B',
      minutes_20_28: 'C',
      minutes_28_30: 'D',
    },
    your_context: 'Context',
    questions_to_ask: ['Question?'],
    suggested_resources: [],
  },
  mentor: {
    session_objectives: ['Review propulsion trade study'],
    recommended_agenda: {
      minutes_0_5: 'Frame',
      minutes_5_20: 'Compare',
      minutes_20_28: 'Review',
      minutes_28_30: 'Wrap',
    },
    mentee_context_summary: 'Buyer is evaluating electric propulsion.',
    facilitation_notes: ['Confirm mass budget early.'],
    suggested_resources: ['NASA SBIR archives'],
  },
};

function baseContext(
  overrides: Partial<AdminBookingExportContext> = {},
): AdminBookingExportContext {
  return {
    id: 'b0000001-0000-4000-8000-000000000001',
    status: 'confirmed',
    service_type: 'session_1on1',
    scheduled_at: '2026-07-20T18:00:00.000Z',
    created_at: '2026-07-15T12:00:00.000Z',
    duration_minutes: null,
    campaign_id: null,
    marketing_referrer: null,
    match_reason: 'I want help with propulsion trade studies.',
    intake_background: 'Systems engineer at a smallsat startup.',
    briefing_json: sessionBundle,
    menteeName: 'Alex Buyer',
    menteeEmail: 'alex@example.com',
    mentorName: 'Chris Sembroski',
    transaction: {
      status: 'completed',
      created_at: '2026-07-15T12:05:00.000Z',
      gross_amount_cents: 15000,
    },
    ...overrides,
  };
}

describe('resolvePrimaryTransaction', () => {
  it('prefers the latest completed transaction', () => {
    const picked = resolvePrimaryTransaction([
      {
        status: 'failed',
        created_at: '2026-07-15T12:10:00.000Z',
        gross_amount_cents: 15000,
      },
      {
        status: 'completed',
        created_at: '2026-07-15T12:05:00.000Z',
        gross_amount_cents: 15000,
      },
      {
        status: 'completed',
        created_at: '2026-07-15T12:08:00.000Z',
        gross_amount_cents: 15000,
      },
    ]);

    expect(picked?.created_at).toBe('2026-07-15T12:08:00.000Z');
    expect(picked?.status).toBe('completed');
  });
});

describe('formatBookingExportMarkdown', () => {
  it('includes intake, expert brief, and email by default', () => {
    const markdown = formatBookingExportMarkdown(baseContext(), {
      exportedAt: '2026-07-16T10:00:00.000Z',
    });

    expect(markdown).toContain('# AstroLink session brief — INTERNAL');
    expect(markdown).toContain('Alex Buyer');
    expect(markdown).toContain('alex@example.com');
    expect(markdown).toContain('propulsion trade studies');
    expect(markdown).toContain('Review propulsion trade study');
    expect(markdown).toContain('Confirm mass budget early.');
    expect(markdown).toContain('**Duration:** 30 min');
    expect(markdown).not.toMatch(/pi_|dev_skip_|ch_/);
  });

  it('omits email when includeEmail is false', () => {
    const markdown = formatBookingExportMarkdown(baseContext(), { includeEmail: false });
    expect(markdown).not.toContain('alex@example.com');
    expect(markdown).not.toContain('**Buyer email:**');
  });

  it('warns on pending payment without implying confirmation', () => {
    const markdown = formatBookingExportMarkdown(
      baseContext({ status: 'pending_payment', briefing_json: null, transaction: null }),
    );

    expect(markdown).toContain('⚠️ Payment not confirmed');
    expect(markdown).toContain('Not generated');
    expect(markdown).not.toContain('Payment confirmed');
  });

  it('warns on cancelled bookings', () => {
    const markdown = formatBookingExportMarkdown(baseContext({ status: 'cancelled' }));
    expect(markdown).toContain('⚠️ Session cancelled');
    expect(shouldWarnOps('cancelled')).toBe(true);
  });

  it('labels confirmed bookings without a transaction row', () => {
    const summary = formatPaymentSummary({
      status: 'confirmed',
      transaction: null,
    });
    expect(summary.label).toContain('no ledger row');
  });

  it('reports missing brief on confirmed bookings', () => {
    const status = resolveBriefExportStatus({
      status: 'confirmed',
      briefing_json: null,
    });
    expect(status.label).toBe('Missing');
    expect(status.ready).toBe(false);
  });
});

describe('buildBookingExportFilename', () => {
  it('uses id prefix and scheduled date', () => {
    expect(buildBookingExportFilename(baseContext())).toBe(
      'astrolink-booking-brief-b0000001-2026-07-20.md',
    );
  });
});