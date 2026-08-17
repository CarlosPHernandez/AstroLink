import 'server-only';

import {
  callLlmWithBackoff,
  generateStructuredJson,
  isE2eStubLlmEnabled,
  isLlmRateLimitError,
  llmFlashModel,
} from '@/lib/llm';
import type { LlmAuditAgentId } from '@/lib/llm-audit';
import { supabaseAdmin } from '@/lib/supabase';
import type { MatchingOutput } from '@/lib/types';

export class ExpertMatchFailedError extends Error {
  readonly code = 'match_failed' as const;

  constructor(message: string) {
    super(message);
    this.name = 'ExpertMatchFailedError';
  }
}

export const EXPERT_MATCH_EMPTY_POOL =
  'No listed experts are available to match right now. Browse the directory to book someone directly.';

export const EXPERT_MATCH_INVALID =
  'Gemini could not match you to a listed expert from these goals. Add more detail, or choose someone from the directory.';

export const EXPERT_MATCH_UNAVAILABLE =
  'Gemini could not complete a match just now. Try again, or choose someone from the directory.';

export type ListedMentorMatchRow = {
  id: string;
  slug: string | null;
  full_name: string;
  employer: string | null;
  expertise: string[] | null;
  bio: string | null;
};

export async function loadListedMentorPool(): Promise<ListedMentorMatchRow[]> {
  const { data, error } = await supabaseAdmin
    .from('mentors')
    .select('id, slug, full_name, employer, expertise, bio')
    .eq('compliance_status', 'approved')
    .eq('is_listed', true);

  if (error) {
    throw new Error(`Failed to load expert pool: ${error.message}`);
  }
  return (data ?? []) as ListedMentorMatchRow[];
}

export async function matchListedMentor(input: {
  menteeGoals: string;
  menteeBackground: string;
  serviceType: string;
  rateLimitKey: string;
  agentId: LlmAuditAgentId;
  operation: string;
  refId?: string | null;
  mentors?: ListedMentorMatchRow[];
}): Promise<MatchingOutput> {
  const mentors = input.mentors ?? (await loadListedMentorPool());
  if (mentors.length === 0) {
    throw new ExpertMatchFailedError(EXPERT_MATCH_EMPTY_POOL);
  }

  if (isE2eStubLlmEnabled()) {
    const first = mentors[0];
    return {
      mentor_id: first.id,
      match_score: 0.85,
      match_reason: 'E2E stub: first listed expert (LLM stubbed).',
    };
  }

  const matchingSystemInstruction = `
      You are AstroLink's expert-matching engine for paid aerospace expert sessions (GLG/Minnect-style, not job placement).
      Match the buyer's goals and background to the single best expert in the pool for their booked session type.
      Strict constraints:
      - Return valid JSON matching the schema precisely.
      - Optimize for topical fit, credibility, and session value — not hiring fit or resume screening.
    `;

  const prompt = `
      Buyer goals: ${input.menteeGoals}
      Buyer background: ${input.menteeBackground}
      Session type: ${input.serviceType}

      Expert pool:
      ${JSON.stringify(mentors, null, 2)}
    `;

  let result: MatchingOutput;
  try {
    result = await callLlmWithBackoff(() =>
      generateStructuredJson<MatchingOutput>({
        model: llmFlashModel,
        rateLimitKey: input.rateLimitKey,
        systemInstruction: matchingSystemInstruction,
        prompt,
        audit: {
          agentId: input.agentId,
          operation: input.operation,
          refId: input.refId ?? null,
        },
        schema: {
          type: 'OBJECT',
          properties: {
            mentor_id: { type: 'STRING' },
            match_score: { type: 'NUMBER' },
            match_reason: { type: 'STRING' },
          },
          required: ['mentor_id', 'match_score', 'match_reason'],
        },
      }),
    );
  } catch (error) {
    if (error instanceof ExpertMatchFailedError || isLlmRateLimitError(error)) {
      throw error;
    }
    console.warn('[expert-match] matcher failed', error);
    throw new ExpertMatchFailedError(EXPERT_MATCH_UNAVAILABLE);
  }

  const mentorInPool = mentors.some((mentor) => mentor.id === result.mentor_id);
  if (!mentorInPool) {
    throw new ExpertMatchFailedError(EXPERT_MATCH_INVALID);
  }

  return result;
}
