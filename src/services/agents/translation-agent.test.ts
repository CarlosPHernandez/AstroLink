import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockSessionMaybeSingle = vi.hoisted(() => vi.fn());
const mockTranslationMaybeSingle = vi.hoisted(() => vi.fn());
const mockBookingSingle = vi.hoisted(() => vi.fn());
const mockUpsert = vi.hoisted(() => vi.fn());
const mockAuditInsert = vi.hoisted(() => vi.fn());
const mockGenerateStructuredJson = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (table === 'sessions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: mockSessionMaybeSingle })),
          })),
        };
      }
      if (table === 'session_translations') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({ maybeSingle: mockTranslationMaybeSingle })),
            })),
          })),
          upsert: mockUpsert,
        };
      }
      if (table === 'bookings') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ single: mockBookingSingle })),
          })),
        };
      }
      if (table === 'audit_log') {
        return { insert: mockAuditInsert };
      }
      return { select: vi.fn() };
    }),
  },
}));

vi.mock('@/lib/llm', () => ({
  callLlmWithBackoff: (fn: () => Promise<unknown>) => fn(),
  generateStructuredJson: (...args: unknown[]) => mockGenerateStructuredJson(...args),
  llmFlashModel: 'test-model',
}));

import { TranslationAgent } from '@/services/agents/translation-agent';

const englishRecap = {
  session_summary: 'English summary',
  key_insights: ['insight one'],
  action_items: [{ task: 'Follow up', owner: 'mentee' as const, deadline: 'Friday' }],
  mentor_feedback_prompt: 'Rate clarity',
  recommended_next_session: 'Systems review',
};

describe('TranslationAgent.translateSessionRecap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTranslationMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockSessionMaybeSingle.mockResolvedValue({
      data: { summary_json: englishRecap },
      error: null,
    });
    mockBookingSingle.mockResolvedValue({
      data: { mentee_id: 'mentee-1' },
      error: null,
    });
    mockUpsert.mockResolvedValue({ error: null });
    mockAuditInsert.mockResolvedValue({ error: null });
    delete process.env.E2E_STUB_LLM;
  });

  afterEach(() => {
    delete process.env.E2E_STUB_LLM;
  });

  it('skips when target locale is English', async () => {
    const agent = new TranslationAgent();
    const result = await agent.translateSessionRecap('booking-1', 'en');

    expect(result).toBeNull();
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(mockAuditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'RECAP_TRANSLATION_SKIPPED',
        payload: expect.objectContaining({ reason: 'same_language' }),
      }),
    );
  });

  it('returns existing translation without LLM call (idempotent)', async () => {
    mockTranslationMaybeSingle.mockResolvedValueOnce({
      data: { summary_json: { ...englishRecap, session_summary: '[pt-BR] cached' } },
      error: null,
    });

    const agent = new TranslationAgent();
    const result = await agent.translateSessionRecap('booking-1', 'pt-BR');

    expect(result?.session_summary).toBe('[pt-BR] cached');
    expect(mockGenerateStructuredJson).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('uses deterministic E2E stub with locale prefix (D10)', async () => {
    process.env.E2E_STUB_LLM = 'true';
    process.env.NODE_ENV = 'test';

    const agent = new TranslationAgent();
    const result = await agent.translateSessionRecap('booking-1', 'pt-BR');

    expect(result?.session_summary).toBe('[pt-BR] English summary');
    expect(mockGenerateStructuredJson).not.toHaveBeenCalled();
    expect(mockUpsert).toHaveBeenCalled();
    expect(mockAuditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        agent_id: 'APX-06',
        event: 'RECAP_TRANSLATED',
      }),
    );
  });
});
