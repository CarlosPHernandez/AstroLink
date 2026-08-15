import 'server-only';

import { callLlmWithBackoff, generateStructuredJson, llmFlashModel } from '@/lib/llm';
import type { LlmAuditAgentId } from '@/lib/llm-audit';
import { supabaseAdmin } from '@/lib/supabase';
import type { MatchingOutput } from '@/lib/types';

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
    throw new Error('No approved mentors available in the pool.');
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

  const result = await callLlmWithBackoff(() =>
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

  const mentorInPool = mentors.some((mentor) => mentor.id === result.mentor_id);
  if (!mentorInPool) {
    throw new Error('Matching engine returned an unknown expert');
  }

  return result;
}
