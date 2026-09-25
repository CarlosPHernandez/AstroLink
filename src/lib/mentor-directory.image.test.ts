import { describe, expect, it } from 'vitest';

import { mentorToListedExpert } from '@/lib/mentor-directory';
import type { Mentor } from '@/lib/types';

const mentor = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'avery@example.com',
  full_name: 'Avery Quinn',
  slug: 'avery-quinn',
  title: 'Engineer',
  employer: 'JSC',
  is_civil_servant: false,
  expertise: ['Guidance'],
  bio: 'Flies the sim.',
  image_url: null,
  intro_video_url: null,
  live_session_price_cents: 15000,
  stripe_connect_account_id: null,
  stripe_onboarding_completed: false,
  compliance_status: 'approved',
  is_listed: true,
  created_at: '2026-09-24T00:00:00.000Z',
} satisfies Mentor;

describe('mentorToListedExpert portrait', () => {
  it('keeps a missing photo null instead of using Chris', () => {
    expect(mentorToListedExpert(mentor).imageUrl).toBeNull();
  });
});
