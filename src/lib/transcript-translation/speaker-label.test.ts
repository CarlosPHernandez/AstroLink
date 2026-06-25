import { describe, expect, it } from 'vitest';

import { resolveSessionSpeakerLabel } from '@/lib/transcript-translation/speaker-label';

describe('resolveSessionSpeakerLabel', () => {
  const names = {
    mentorFullName: 'Chris Sembroski',
    menteeFullName: 'Carlos Hernandez',
  };

  it('uses mentor first name for expert speech', () => {
    expect(
      resolveSessionSpeakerLabel({
        ...names,
        speakerRole: 'mentor',
        viewerRole: 'mentee',
      }),
    ).toBe('Chris');
  });

  it('shows You when the mentee views their own speech', () => {
    expect(
      resolveSessionSpeakerLabel({
        ...names,
        speakerRole: 'mentee',
        viewerRole: 'mentee',
      }),
    ).toBe('You');
  });

  it('uses mentee first name when the mentor views buyer speech', () => {
    expect(
      resolveSessionSpeakerLabel({
        ...names,
        speakerRole: 'mentee',
        viewerRole: 'mentor',
      }),
    ).toBe('Carlos');
  });

  it('falls back when names are blank', () => {
    expect(
      resolveSessionSpeakerLabel({
        mentorFullName: '  ',
        menteeFullName: '',
        speakerRole: 'mentor',
        viewerRole: 'admin',
      }),
    ).toBe('Expert');
    expect(
      resolveSessionSpeakerLabel({
        mentorFullName: 'Chris',
        menteeFullName: '',
        speakerRole: 'mentee',
        viewerRole: 'mentor',
      }),
    ).toBe('Guest');
  });
});