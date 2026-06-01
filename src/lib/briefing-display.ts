import type { MentorBriefingOutput, PreCallBriefOutput } from '@/lib/types';

export type BriefingPayload = MentorBriefingOutput | PreCallBriefOutput;

export function isSessionBriefing(briefing: BriefingPayload | null): briefing is MentorBriefingOutput {
  return briefing !== null && 'session_objectives' in briefing;
}

export function isPreCallBrief(briefing: BriefingPayload | null): briefing is PreCallBriefOutput {
  return briefing !== null && 'proposed_questions' in briefing;
}

export const BRIEFING_THINKING_STEPS = [
  'Reading your session goals…',
  'Matching expert context…',
  'Structuring agenda & objectives…',
  'APX-02 compiling your brief…',
] as const;
