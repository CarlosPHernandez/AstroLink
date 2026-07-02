import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { createDevSkippedPaymentIntentId } from '@/lib/booking-payments';
import { supabaseAdmin } from '@/lib/supabase';
import { BriefingAgent } from '@/services/agents/briefing-agent';

const MENTEE_ID = 'a0000001-0000-4000-8000-000000000001';
const MENTOR_ID = 'a0000002-0000-4000-8000-000000000002';

const runSmoke = process.env.SMOKE_BRIEFING === 'true';

describe.skipIf(!runSmoke)('smoke: APX-02 briefing via Gemini', () => {
  let bookingId: string | null = null;

  afterAll(async () => {
    if (!bookingId) {
      return;
    }
    await supabaseAdmin.from('audit_log').delete().eq('ref_id', bookingId);
    await supabaseAdmin.from('bookings').delete().eq('id', bookingId);
  });

  it('generates briefing_json and LLM_DECISION audit row', async () => {
    bookingId = randomUUID();
    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabaseAdmin.from('bookings').insert({
      id: bookingId,
      mentee_id: MENTEE_ID,
      mentor_id: MENTOR_ID,
      service_type: 'session_1on1',
      include_pre_call_brief: false,
      status: 'pending_payment',
      scheduled_at: scheduledAt,
      stripe_payment_intent_id: createDevSkippedPaymentIntentId(),
      match_reason:
        'I want to understand commercial payload integration tradeoffs for a cubesat mission.',
      intake_background: 'Early-stage startup founder with a first launch in 18 months.',
    });

    expect(insertError).toBeNull();

    const briefingAgent = new BriefingAgent();
    const generated = await briefingAgent.prepareBriefing(bookingId);
    expect(generated).toBeTruthy();

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('briefing_json')
      .eq('id', bookingId)
      .single();

    expect(bookingError).toBeNull();
    expect(booking?.briefing_json).toBeTruthy();

    const briefing = booking?.briefing_json as Record<string, unknown>;
    expect(briefing.version).toBe(2);

    const { data: decisions, error: auditError } = await supabaseAdmin
      .from('audit_log')
      .select('agent_id, event, payload')
      .eq('ref_id', bookingId)
      .eq('event', 'LLM_DECISION');

    expect(auditError).toBeNull();
    expect(decisions?.length).toBeGreaterThan(0);

    const apx02 = decisions?.find((row) => row.agent_id === 'APX-02');
    expect(apx02).toBeTruthy();
    const payload = apx02?.payload as Record<string, unknown>;
    expect(payload.provider).toBe('gemini');
    expect(payload.model).toBeTruthy();
    expect(payload.prompt_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(payload.output_summary).toBeTruthy();
    expect(payload.operation).toBe('dual_session_briefing');
  }, 180_000);
});