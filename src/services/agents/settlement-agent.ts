import type { Json } from '@/lib/database.types';
import { callLlmWithBackoff, generateStructuredJson, getLlmProvider, llmFlashModel } from '@/lib/llm';
import {
  applySettlementPolicy,
  buildSettlementPrompt,
  isSettlementDecision,
  type SettlementDecision,
  type SettlementFacts,
} from '@/lib/session-settlement';
import { supabaseAdmin } from '@/lib/supabase';

export class SettlementAgent {
  private agentId = 'APX-12' as const;

  async settleFromFacts(bookingId: string, facts: SettlementFacts) {
    const { data: existing } = await supabaseAdmin
      .from('session_settlements')
      .select('id')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (existing?.id) {
      return { skipped: true as const, reason: 'already_settled' };
    }

    const raw = await callLlmWithBackoff(() =>
      generateStructuredJson<{
        decision: string;
        confidence: number;
        rationale: string;
      }>({
        model: llmFlashModel,
        rateLimitKey: `settlement:${bookingId}`,
        systemInstruction:
          'You settle paid expert sessions for AstroLink. Use only the telemetry facts. Do not invent what was said. Return valid JSON.',
        prompt: buildSettlementPrompt(facts),
        audit: {
          agentId: this.agentId,
          operation: 'session_settle',
          refId: bookingId,
        },
        schema: {
          type: 'OBJECT',
          properties: {
            decision: {
              type: 'STRING',
              enum: ['completed', 'no_show_buyer', 'no_show_expert', 'too_short', 'dispute_hold'],
            },
            confidence: { type: 'NUMBER' },
            rationale: { type: 'STRING' },
          },
          required: ['decision', 'confidence', 'rationale'],
        },
      }),
    );

    const decision: SettlementDecision = isSettlementDecision(raw.decision)
      ? raw.decision
      : 'dispute_hold';
    const policy = applySettlementPolicy(decision);

    const { error: insertError } = await supabaseAdmin.from('session_settlements').insert({
      booking_id: bookingId,
      decision,
      confidence: raw.confidence,
      rationale: raw.rationale,
      payout_eligible: policy.payoutEligible,
      refund_recommended: policy.refundRecommended,
      provider: getLlmProvider(),
      model: llmFlashModel,
    });

    if (insertError) {
      throw new Error(`Failed to persist settlement: ${insertError.message}`);
    }

    await supabaseAdmin
      .from('bookings')
      .update({ payout_eligible: policy.payoutEligible })
      .eq('id', bookingId);

    await supabaseAdmin.from('audit_log').insert({
      agent_id: this.agentId,
      event: 'SESSION_SETTLED',
      ref_id: bookingId,
      payload: {
        decision,
        payout_eligible: policy.payoutEligible,
        refund_recommended: policy.refundRecommended,
      } as unknown as Json,
    });

    return {
      skipped: false as const,
      decision,
      ...policy,
    };
  }
}
