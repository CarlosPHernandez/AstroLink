import type { LlmJsonSchema } from '@/lib/llm';
import type { PathAssessmentAnswers } from '@/lib/path-assessment/schema';

/**
 * Strong system instruction for Gemini Space Path Assessment (XPRIZE / free funnel).
 * Prefer LLM_PROVIDER=gemini with GEMINI_API_KEY for production demos.
 */
export const PATH_ASSESSMENT_SYSTEM_INSTRUCTION = `
You are AstroLink's Space Path Assessment engine — a practical career coach for people
exploring aerospace, space, defense-adjacent, and related technical paths.

Given a short intake (stage, goal, experience, network, obstacle), produce a personalized
readiness report in valid JSON only.

Tone: calm, specific, high-trust. No hype, no purple "AI" marketing voice, no starfield clichés.
Be concrete: name realistic gaps, actions, and the kind of expert conversation that would help.
Do NOT invent credentials the person claimed. Do NOT guarantee jobs, visas, or clearances.
Do NOT act as a recruiting ATS or score "hireability." Focus on readiness and next steps.

Field guidance:
- headline: one sharp line (≤12 words) on where they stand relative to their goal.
- standing_summary: 2–4 sentences tailored to their stage and goal.
- key_gaps: 2–3 items with title + detail (actionable, not generic).
- focus_areas: 2–4 short focus labels for the next 12–24 months.
- expert_conversation_type: what kind of live 1:1 expert talk would help most (one sentence).
- next_actions: exactly 3 items with action + why.
- upsell_bridge_live: one warm sentence inviting a live expert review of this report (no price).
- upsell_bridge_written: one short sentence for a future written expert review (no price); keep for schema completeness.

Return valid JSON matching the schema. No markdown fences.
`.trim();

export const PATH_ASSESSMENT_REPORT_SCHEMA: LlmJsonSchema = {
  type: 'OBJECT',
  properties: {
    headline: { type: 'STRING' },
    standing_summary: { type: 'STRING' },
    key_gaps: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          detail: { type: 'STRING' },
        },
        required: ['title', 'detail'],
      },
    },
    focus_areas: {
      type: 'ARRAY',
      items: { type: 'STRING' },
    },
    expert_conversation_type: { type: 'STRING' },
    next_actions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          action: { type: 'STRING' },
          why: { type: 'STRING' },
        },
        required: ['action', 'why'],
      },
    },
    upsell_bridge_live: { type: 'STRING' },
    upsell_bridge_written: { type: 'STRING' },
  },
  required: [
    'headline',
    'standing_summary',
    'key_gaps',
    'focus_areas',
    'expert_conversation_type',
    'next_actions',
    'upsell_bridge_live',
    'upsell_bridge_written',
  ],
};

export function buildPathAssessmentUserPrompt(answers: PathAssessmentAnswers): string {
  return `
Space Path Assessment intake:

First name: ${answers.firstName}
Email: ${answers.email}
Stage: ${answers.stage}
Primary goal (12–24 months): ${answers.primaryGoal}
Experience / education / projects: ${answers.experience}
Network in space/aerospace: ${answers.network}
Biggest obstacle + clarity need: ${answers.obstacle}

Produce the personalized readiness report JSON now.
`.trim();
}
