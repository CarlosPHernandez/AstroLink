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

export function briefingContentReady(
  briefing: BriefingPayload,
  audience: 'mentee' | 'mentor',
): boolean {
  if (isPreCallBrief(briefing)) {
    return audience === 'mentee';
  }
  return isSessionBriefingBundle(briefing) || isLegacySessionBriefing(briefing);
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

function appendAgendaLines(lines: string[], agenda: MenteeBriefingOutput['recommended_agenda']) {
  lines.push('', 'Your session plan');
  lines.push(`0–5 min: ${agenda.minutes_0_5}`);
  lines.push(`5–20 min: ${agenda.minutes_5_20}`);
  lines.push(`20–28 min: ${agenda.minutes_20_28}`);
  lines.push(`28–30 min: ${agenda.minutes_28_30}`);
}

/** Plain-text mentee brief for clipboard + email (Chris post-payment modal). */
export function formatMenteeBriefAsPlainText(briefing: BriefingPayload): string {
  const mentee = resolveMenteeBrief(briefing);
  if (mentee) {
    const lines: string[] = [mentee.personal_intro, '', 'Your objectives'];
    mentee.session_objectives.forEach((objective, index) => {
      lines.push(`${index + 1}. ${objective}`);
    });
    appendAgendaLines(lines, mentee.recommended_agenda);
    lines.push('', 'Your context', mentee.your_context, '', 'Questions to ask');
    mentee.questions_to_ask.forEach((question, index) => {
      lines.push(`${index + 1}. ${question}`);
    });
    if (mentee.suggested_resources.length > 0) {
      lines.push('', 'Suggested resources');
      mentee.suggested_resources.forEach((resource) => lines.push(`- ${resource}`));
    }
    return lines.join('\n');
  }

  if (isLegacySessionBriefing(briefing)) {
    const lines: string[] = ['Session objectives'];
    briefing.session_objectives.forEach((objective, index) => {
      lines.push(`${index + 1}. ${objective}`);
    });
    lines.push('', 'Recommended agenda');
    lines.push(`0–5 min: ${briefing.recommended_agenda.minutes_0_5}`);
    lines.push(`5–20 min: ${briefing.recommended_agenda.minutes_5_20}`);
    lines.push(`20–28 min: ${briefing.recommended_agenda.minutes_20_28}`);
    lines.push(`28–30 min: ${briefing.recommended_agenda.minutes_28_30}`);
    lines.push('', 'Your context', briefing.mentee_context_summary);
    if (briefing.suggested_resources.length > 0) {
      lines.push('', 'Suggested resources');
      briefing.suggested_resources.forEach((resource) => lines.push(`- ${resource}`));
    }
    return lines.join('\n');
  }

  if (isPreCallBrief(briefing)) {
    const lines: string[] = [briefing.one_line_summary, '', 'Context summary', briefing.buyer_context_summary];
    if (briefing.proposed_questions.length > 0) {
      lines.push('', 'Questions for your expert');
      briefing.proposed_questions.forEach((question, index) => {
        lines.push(`${index + 1}. ${question}`);
      });
    }
    return lines.join('\n');
  }

  return '';
}