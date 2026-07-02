import { describe, expect, it } from 'vitest';
import {
  formatXprizeDecisionExport,
  XPRIZE_DECISION_LOG_SCHEMA_VERSION,
} from '@/lib/xprize-decision-logs';

describe('formatXprizeDecisionExport', () => {
  it('maps audit_log rows to T8 judge schema', () => {
    const payload = formatXprizeDecisionExport([
      {
        id: '11111111-1111-4111-8111-111111111111',
        ts: '2026-07-01T12:00:00.000Z',
        agent_id: 'APX-02',
        ref_id: '22222222-2222-4222-8222-222222222222',
        payload: {
          operation: 'dual_session_briefing',
          provider: 'gemini',
          model: 'gemini-flash-latest',
          prompt_hash: 'abc123',
          output_summary: 'Focused on commercial payload ops.',
        },
      },
    ]);

    expect(payload.schema_version).toBe(XPRIZE_DECISION_LOG_SCHEMA_VERSION);
    expect(payload.decision_count).toBe(1);
    expect(payload.decisions[0]).toEqual({
      id: '11111111-1111-4111-8111-111111111111',
      ts: '2026-07-01T12:00:00.000Z',
      agent_id: 'APX-02',
      ref_id: '22222222-2222-4222-8222-222222222222',
      operation: 'dual_session_briefing',
      provider: 'gemini',
      model: 'gemini-flash-latest',
      prompt_hash: 'abc123',
      output_summary: 'Focused on commercial payload ops.',
    });
  });
});