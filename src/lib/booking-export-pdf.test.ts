import { describe, expect, it } from 'vitest';
import type { AdminBookingExportContext } from '@/lib/booking-export';
import {
  buildBookingExportPdfFilename,
  buildExpertBriefPdfSections,
  renderBookingBriefPdf,
} from '@/lib/booking-export-pdf';
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
    duration_minutes: 30,
    campaign_id: null,
    marketing_referrer: null,
    match_reason: 'I want help with propulsion trade studies.',
    intake_background: 'Systems engineer at a smallsat startup.',
    briefing_json: sessionBundle,
    menteeName: 'Alex Buyer',
    menteeEmail: 'alex@example.com',
    mentorName: 'Chris Sembroski',
    transaction: null,
    ...overrides,
  };
}

describe('buildExpertBriefPdfSections', () => {
  it('omits buyer email by default', () => {
    const sections = buildExpertBriefPdfSections(baseContext());
    const sessionParagraph = sections.find(
      (section) => section.kind === 'paragraph' && section.text.includes('Buyer:'),
    );
    expect(sessionParagraph?.kind).toBe('paragraph');
    if (sessionParagraph?.kind === 'paragraph') {
      expect(sessionParagraph.text).not.toContain('alex@example.com');
    }
  });

  it('includes payment warning for pending bookings', () => {
    const sections = buildExpertBriefPdfSections(baseContext({ status: 'pending_payment' }));
    expect(sections.some((section) => section.kind === 'warning')).toBe(true);
  });

  it('includes expert objectives when brief is ready', () => {
    const sections = buildExpertBriefPdfSections(baseContext());
    const bullets = sections.filter((section) => section.kind === 'bullets');
    expect(bullets.some((section) => section.items.includes('Review propulsion trade study'))).toBe(
      true,
    );
  });
});

describe('renderBookingBriefPdf', () => {
  it('returns a valid PDF byte stream', async () => {
    const bytes = await renderBookingBriefPdf(baseContext());
    const header = Buffer.from(bytes.slice(0, 5)).toString('utf8');
    expect(header).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(500);
  });
});

describe('buildBookingExportPdfFilename', () => {
  it('uses session-prep prefix and pdf extension', () => {
    expect(buildBookingExportPdfFilename(baseContext())).toBe(
      'astrolink-session-prep-b0000001-2026-07-20.pdf',
    );
  });
});