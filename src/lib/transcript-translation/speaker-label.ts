import { firstDisplayName } from '@/lib/display-name';
import type { TranscriptUtterance } from '@/lib/transcript-translation/types';

export type SessionSpeakerLabelContext = {
  speakerRole: TranscriptUtterance['speakerRole'];
  viewerRole: 'mentee' | 'mentor' | 'admin';
  mentorFullName: string;
  menteeFullName: string;
};

export function resolveSessionSpeakerLabel(ctx: SessionSpeakerLabelContext): string {
  const mentorFirst = firstDisplayName(ctx.mentorFullName) || 'Expert';
  const menteeFirst = firstDisplayName(ctx.menteeFullName) || 'Guest';

  if (ctx.speakerRole === 'mentor') {
    return mentorFirst;
  }
  if (ctx.speakerRole === 'mentee') {
    if (ctx.viewerRole === 'mentee') {
      return 'You';
    }
    return menteeFirst;
  }
  return 'Speaker';
}