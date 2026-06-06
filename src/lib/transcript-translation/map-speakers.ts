import type { TranscriptSpeakerRole, TranscriptUtterance } from '@/lib/transcript-translation/types';

export type SpeakerMappingContext = {
  mentorUserId: string;
  menteeUserId: string;
  mentorDisplayName?: string | null;
  menteeDisplayName?: string | null;
};

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase();
}

function roleForSpeakerId(
  speakerId: string,
  context: SpeakerMappingContext,
): TranscriptSpeakerRole {
  const normalized = normalizeLabel(speakerId);
  if (!normalized || normalized === 'unknown') {
    return 'unknown';
  }

  if (
    normalized === normalizeLabel(context.mentorUserId) ||
    (context.mentorDisplayName &&
      normalized === normalizeLabel(context.mentorDisplayName))
  ) {
    return 'mentor';
  }

  if (
    normalized === normalizeLabel(context.menteeUserId) ||
    (context.menteeDisplayName &&
      normalized === normalizeLabel(context.menteeDisplayName))
  ) {
    return 'mentee';
  }

  return 'unknown';
}

/**
 * Map Daily speaker labels (user_id or display name) to mentor/mentee roles.
 */
export function mapSpeakersToRoles(
  utterances: TranscriptUtterance[],
  context: SpeakerMappingContext,
): TranscriptUtterance[] {
  return utterances.map((utterance) => ({
    ...utterance,
    speakerRole: roleForSpeakerId(utterance.speakerId, context),
  }));
}
