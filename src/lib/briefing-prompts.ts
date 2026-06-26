import type { LlmJsonSchema } from '@/lib/llm';

const agendaSchema: LlmJsonSchema = {
  type: 'OBJECT',
  properties: {
    minutes_0_5: { type: 'STRING' },
    minutes_5_20: { type: 'STRING' },
    minutes_20_28: { type: 'STRING' },
    minutes_28_30: { type: 'STRING' },
  },
  required: ['minutes_0_5', 'minutes_5_20', 'minutes_20_28', 'minutes_28_30'],
};

export const DUAL_SESSION_BRIEFING_SCHEMA: LlmJsonSchema = {
  type: 'OBJECT',
  properties: {
    version: { type: 'NUMBER' },
    mentee: {
      type: 'OBJECT',
      properties: {
        personal_intro: { type: 'STRING' },
        session_objectives: { type: 'ARRAY', items: { type: 'STRING' } },
        recommended_agenda: agendaSchema,
        your_context: { type: 'STRING' },
        questions_to_ask: { type: 'ARRAY', items: { type: 'STRING' } },
        suggested_resources: { type: 'ARRAY', items: { type: 'STRING' } },
      },
      required: [
        'personal_intro',
        'session_objectives',
        'recommended_agenda',
        'your_context',
        'questions_to_ask',
        'suggested_resources',
      ],
    },
    mentor: {
      type: 'OBJECT',
      properties: {
        session_objectives: { type: 'ARRAY', items: { type: 'STRING' } },
        recommended_agenda: agendaSchema,
        mentee_context_summary: { type: 'STRING' },
        facilitation_notes: { type: 'ARRAY', items: { type: 'STRING' } },
        suggested_resources: { type: 'ARRAY', items: { type: 'STRING' } },
      },
      required: [
        'session_objectives',
        'recommended_agenda',
        'mentee_context_summary',
        'facilitation_notes',
        'suggested_resources',
      ],
    },
  },
  required: ['version', 'mentee', 'mentor'],
};

export const DUAL_SESSION_BRIEFING_SYSTEM_INSTRUCTION = `
  You are AstroLink's expert-session preparation engine for paid aerospace and space calls.
  Produce a version-2 dual-audience briefing: one slice for the booking user (mentee) and one for the expert (mentor).
  Focus on session goals and agenda — not job applications, resume scoring, or employer shortlists.

  Voice rules (strict):
  - mentee.* fields: second person only (you/your). Open personal_intro with "Based on your…".
    Never refer to the mentee as "the buyer", "the user", or "they".
  - mentor.* fields: third person about the mentee (the mentee / they). Expert facilitation tone.

  Set version to 2. Return valid JSON only.
`.trim();