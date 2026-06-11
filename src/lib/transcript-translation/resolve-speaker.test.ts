import { describe, expect, it } from 'vitest';

import { resolveSpeakerUserId } from '@/lib/transcript-translation/resolve-speaker';

describe('resolveSpeakerUserId', () => {
  const participants = {
    local: { session_id: 'sess-local', user_id: 'mentee-uuid' },
    remote: { session_id: 'sess-remote', user_id: 'mentor-uuid' },
  };

  it('maps Daily participantId to app user_id', () => {
    expect(resolveSpeakerUserId(participants, 'sess-remote')).toBe('mentor-uuid');
    expect(resolveSpeakerUserId(participants, 'sess-local')).toBe('mentee-uuid');
  });

  it('returns unknown for missing participant', () => {
    expect(resolveSpeakerUserId(participants, 'sess-unknown')).toBe('unknown');
    expect(resolveSpeakerUserId(participants, undefined)).toBe('unknown');
    expect(resolveSpeakerUserId(null, 'sess-remote')).toBe('unknown');
  });
});
