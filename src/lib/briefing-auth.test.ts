import { describe, expect, it } from 'vitest';
import { canRefreshBriefing } from '@/lib/briefing-auth';

const booking = {
  bookingMenteeId: 'mentee-uuid',
  bookingMentorId: 'mentor-uuid',
};

describe('canRefreshBriefing', () => {
  it('allows the booking mentee', () => {
    expect(
      canRefreshBriefing({
        ...booking,
        sessionUserId: 'mentee-uuid',
        sessionRole: 'mentee',
      }),
    ).toBe(true);
  });

  it('allows the booking mentor', () => {
    expect(
      canRefreshBriefing({
        ...booking,
        sessionUserId: 'mentor-uuid',
        sessionRole: 'mentor',
      }),
    ).toBe(true);
  });

  it('allows admins', () => {
    expect(
      canRefreshBriefing({
        ...booking,
        sessionUserId: 'admin-uuid',
        sessionRole: 'admin',
      }),
    ).toBe(true);
  });

  it('denies unrelated users', () => {
    expect(
      canRefreshBriefing({
        ...booking,
        sessionUserId: 'other-uuid',
        sessionRole: 'mentee',
      }),
    ).toBe(false);
  });
});