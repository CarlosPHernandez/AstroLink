/** Minimal Daily participant fields needed to map session id → app user id. */
export type DailyParticipantRecord = {
  session_id: string;
  user_id?: string;
};

export type DailyParticipantsMap = Record<string, DailyParticipantRecord>;

/**
 * Map Daily transcription `participantId` (session id) to the app `user_id`
 * set on the meeting token. Falls back to `unknown` when not found.
 */
export function resolveSpeakerUserId(
  participants: DailyParticipantsMap | null | undefined,
  participantId: string | undefined,
): string {
  const pid = participantId?.trim();
  if (!pid || !participants) {
    return 'unknown';
  }

  for (const participant of Object.values(participants)) {
    if (participant.session_id === pid) {
      return participant.user_id?.trim() || 'unknown';
    }
  }

  return 'unknown';
}
