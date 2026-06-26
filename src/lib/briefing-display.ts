import type {
  BriefingPayload,
  ExpertBriefingOutput,
  MenteeBriefingOutput,
  MentorBriefingOutput,
  PreCallBriefOutput,
  SessionBriefingBundle,
} from '@/lib/types';

export type { BriefingPayload };

export function isSessionBriefingBundle(
  briefing: BriefingPayload | null,
): briefing is SessionBriefingBundle {
  return briefing !== null && 'version' in briefing && briefing.version === 2;
}

export function isLegacySessionBriefing(
  briefing: BriefingPayload | null,
): briefing is MentorBriefingOutput {
  return (
    briefing !== null &&
    'session_objectives' in briefing &&
    !('version' in briefing) &&
    !('proposed_questions' in briefing)
  );
}

export function isSessionBriefing(
  briefing: BriefingPayload | null,
): briefing is SessionBriefingBundle | MentorBriefingOutput {
  return isSessionBriefingBundle(briefing) || isLegacySessionBriefing(briefing);
}

export function isPreCallBrief(
  briefing: BriefingPayload | null,
): briefing is PreCallBriefOutput {
  return briefing !== null && 'proposed_questions' in briefing;
}

export function needsBriefingUpgrade(briefing: BriefingPayload | null): boolean {
  return isLegacySessionBriefing(briefing);
}

export function resolveMenteeBrief(
  briefing: BriefingPayload | null,
): MenteeBriefingOutput | null {
  if (isSessionBriefingBundle(briefing)) {
    return briefing.mentee;
  }
  return null;
}

export function resolveExpertBrief(
  briefing: BriefingPayload | null,
): ExpertBriefingOutput | MentorBriefingOutput | null {
  if (isSessionBriefingBundle(briefing)) {
    return briefing.mentor;
  }
  if (isLegacySessionBriefing(briefing)) {
    return briefing;
  }
  return null;
}

export function resolveSessionObjectives(
  briefing: BriefingPayload | null,
  audience: 'mentee' | 'mentor',
): string[] {
  const mentee = resolveMenteeBrief(briefing);
  if (audience === 'mentee' && mentee) {
    return mentee.session_objectives;
  }

  const expert = resolveExpertBrief(briefing);
  if (expert) {
    return expert.session_objectives;
  }

  return [];
}

export const BRIEFING_THINKING_STEPS = [
  'Reading your session goals…',
  'Matching expert context…',
  'Structuring agenda & objectives…',
  'Compiling your brief…',
] as const;