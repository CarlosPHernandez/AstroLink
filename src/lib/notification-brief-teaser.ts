import type { MentorBriefingOutput, PreCallBriefOutput } from '@/lib/types';

type BriefingJson = MentorBriefingOutput | PreCallBriefOutput | Record<string, unknown> | null;

/** First mentor-facing objective line for confirmation email (v1 + forward-compatible v2). */
export function resolveMentorBriefTeaser(briefingJson: BriefingJson): string | null {
  if (!briefingJson || typeof briefingJson !== 'object') {
    return null;
  }

  const record = briefingJson as Record<string, unknown>;

  if (record.version === 2 && record.mentor && typeof record.mentor === 'object') {
    const mentor = record.mentor as Record<string, unknown>;
    const objectives = mentor.session_objectives;
    if (Array.isArray(objectives) && typeof objectives[0] === 'string' && objectives[0].trim()) {
      return objectives[0].trim();
    }
  }

  const objectives = record.session_objectives;
  if (Array.isArray(objectives) && typeof objectives[0] === 'string' && objectives[0].trim()) {
    return objectives[0].trim();
  }

  if (typeof record.one_line_summary === 'string' && record.one_line_summary.trim()) {
    return record.one_line_summary.trim();
  }

  return null;
}