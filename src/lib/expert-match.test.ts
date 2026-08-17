import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockMentorPool = vi.hoisted(() => vi.fn());
const mockIsE2eStubLlmEnabled = vi.hoisted(() => vi.fn());
const mockGenerateStructuredJson = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => mockMentorPool()),
        })),
      })),
    })),
  },
}));

vi.mock('@/lib/llm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/llm')>();
  return {
    ...actual,
    isE2eStubLlmEnabled: () => mockIsE2eStubLlmEnabled(),
    callLlmWithBackoff: (fn: () => Promise<unknown>) => fn(),
    generateStructuredJson: (...args: unknown[]) => mockGenerateStructuredJson(...args),
    llmFlashModel: 'test-model',
    isLlmRateLimitError: actual.isLlmRateLimitError,
  };
});

import { LlmRateLimitError } from '@/lib/llm-rate-limit';
import {
  EXPERT_MATCH_EMPTY_POOL,
  EXPERT_MATCH_INVALID,
  EXPERT_MATCH_UNAVAILABLE,
  ExpertMatchFailedError,
  matchListedMentor,
} from '@/lib/expert-match';

const pool = [
  {
    id: 'mentor-1',
    slug: 'ada-expert',
    full_name: 'Ada Expert',
    employer: 'Orbit Labs',
    expertise: ['propulsion'],
    bio: 'Rocket engineer',
  },
];

describe('matchListedMentor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsE2eStubLlmEnabled.mockReturnValue(false);
    mockMentorPool.mockResolvedValue({ data: pool, error: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('throws a user-facing error when no listed experts exist', async () => {
    mockMentorPool.mockResolvedValue({ data: [], error: null });
    await expect(
      matchListedMentor({
        menteeGoals: 'Propulsion',
        menteeBackground: 'Student',
        serviceType: 'session_1on1',
        rateLimitKey: 'mentee-1',
        agentId: 'APX-01',
        operation: 'expert_match',
      }),
    ).rejects.toMatchObject({
      name: 'ExpertMatchFailedError',
      message: EXPERT_MATCH_EMPTY_POOL,
    });
    expect(mockGenerateStructuredJson).not.toHaveBeenCalled();
  });

  it('returns the first listed expert when the E2E LLM stub is on', async () => {
    mockIsE2eStubLlmEnabled.mockReturnValue(true);
    const result = await matchListedMentor({
      menteeGoals: 'Propulsion',
      menteeBackground: 'Student',
      serviceType: 'session_1on1',
      rateLimitKey: 'mentee-1',
      agentId: 'APX-01',
      operation: 'expert_match',
      mentors: pool,
    });
    expect(result.mentor_id).toBe('mentor-1');
    expect(mockGenerateStructuredJson).not.toHaveBeenCalled();
  });

  it('rejects an LLM id that is not in the listed pool', async () => {
    mockGenerateStructuredJson.mockResolvedValue({
      mentor_id: 'not-listed',
      match_score: 0.9,
      match_reason: 'Invented.',
    });
    await expect(
      matchListedMentor({
        menteeGoals: 'Propulsion',
        menteeBackground: 'Student',
        serviceType: 'session_1on1',
        rateLimitKey: 'mentee-1',
        agentId: 'APX-01',
        operation: 'expert_match',
        mentors: pool,
      }),
    ).rejects.toBeInstanceOf(ExpertMatchFailedError);
    await expect(
      matchListedMentor({
        menteeGoals: 'Propulsion',
        menteeBackground: 'Student',
        serviceType: 'session_1on1',
        rateLimitKey: 'mentee-1',
        agentId: 'APX-01',
        operation: 'expert_match',
        mentors: pool,
      }),
    ).rejects.toThrow(EXPERT_MATCH_INVALID);
  });

  it('returns the LLM pick when the id is in the listed pool', async () => {
    mockGenerateStructuredJson.mockResolvedValue({
      mentor_id: 'mentor-1',
      match_score: 0.91,
      match_reason: 'Propulsion fit.',
    });
    await expect(
      matchListedMentor({
        menteeGoals: 'Propulsion',
        menteeBackground: 'Student',
        serviceType: 'session_1on1',
        rateLimitKey: 'mentee-1',
        agentId: 'APX-01',
        operation: 'expert_match',
        mentors: pool,
      }),
    ).resolves.toEqual({
      mentor_id: 'mentor-1',
      match_score: 0.91,
      match_reason: 'Propulsion fit.',
    });
  });

  it('rethrows an ExpertMatchFailedError from the LLM layer without wrapping', async () => {
    mockGenerateStructuredJson.mockRejectedValue(
      new ExpertMatchFailedError(EXPERT_MATCH_INVALID),
    );
    await expect(
      matchListedMentor({
        menteeGoals: 'Propulsion',
        menteeBackground: 'Student',
        serviceType: 'session_1on1',
        rateLimitKey: 'mentee-1',
        agentId: 'APX-01',
        operation: 'expert_match',
        mentors: pool,
      }),
    ).rejects.toMatchObject({
      name: 'ExpertMatchFailedError',
      message: EXPERT_MATCH_INVALID,
    });
  });

  it('rethrows LLM rate-limit errors so the book API can return 429', async () => {
    mockGenerateStructuredJson.mockRejectedValue(
      new LlmRateLimitError('rate limited', 1500),
    );
    await expect(
      matchListedMentor({
        menteeGoals: 'Propulsion',
        menteeBackground: 'Student',
        serviceType: 'session_1on1',
        rateLimitKey: 'mentee-1',
        agentId: 'APX-01',
        operation: 'expert_match',
        mentors: pool,
      }),
    ).rejects.toBeInstanceOf(LlmRateLimitError);
  });

  it('wraps LLM failures as a user-facing unavailable error', async () => {
    mockGenerateStructuredJson.mockRejectedValue(new Error('provider timeout'));
    await expect(
      matchListedMentor({
        menteeGoals: 'Propulsion',
        menteeBackground: 'Student',
        serviceType: 'session_1on1',
        rateLimitKey: 'mentee-1',
        agentId: 'APX-01',
        operation: 'expert_match',
        mentors: pool,
      }),
    ).rejects.toMatchObject({
      name: 'ExpertMatchFailedError',
      message: EXPERT_MATCH_UNAVAILABLE,
      code: 'match_failed',
    });
  });

  it('does not wrap pool load failures as a Gemini match miss', async () => {
    mockMentorPool.mockResolvedValue({ data: null, error: { message: 'timeout' } });
    await expect(
      matchListedMentor({
        menteeGoals: 'Propulsion',
        menteeBackground: 'Student',
        serviceType: 'session_1on1',
        rateLimitKey: 'mentee-1',
        agentId: 'APX-01',
        operation: 'expert_match',
      }),
    ).rejects.toThrow('Failed to load expert pool: timeout');
  });
});
