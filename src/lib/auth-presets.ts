import 'server-only';
import type { SessionData } from '@/lib/session';

/** Match `supabase/migrations/20260531140100_seed_d1_dev.sql` until Supabase Auth ships. */
export const AUTH_PRESETS = {
  mentor: {
    email: 'chris@astrolink.ai',
    fullName: 'Chris Sembroski',
    role: 'mentor' as const,
    userId: 'a0000002-0000-4000-8000-000000000002',
  },
  mentee: {
    email: 'carlos@astrolink.ai',
    fullName: 'Carlos Hernandez',
    role: 'mentee' as const,
    userId: 'a0000001-0000-4000-8000-000000000001',
  },
  admin: {
    email: 'admin@astrolink.ai',
    fullName: 'Flight Command',
    role: 'admin' as const,
    userId: 'a0000003-0000-4000-8000-000000000003',
  },
} satisfies Record<
  SessionData['role'],
  {
    email: string;
    fullName: string;
    role: SessionData['role'];
    userId: string;
  }
>;

/** Dual-device demo mentor; matches `20260605120000_seed_carlos_demo_mentor.sql`. */
export const DEMO_MENTOR_PRESET = {
  email: 'carlosphernandez2020@gmail.com',
  fullName: 'Carlos Hernandez',
  role: 'mentor' as const,
  userId: 'a0000004-0000-4000-8000-000000000004',
};

export function resolvePresetLogin(email: string): {
  role: SessionData['role'];
  fullName: string;
  userId: string;
  isPreset: boolean;
} | null {
  const normalized = email.trim().toLowerCase();
  if (normalized === DEMO_MENTOR_PRESET.email) {
    return { ...DEMO_MENTOR_PRESET, isPreset: true };
  }
  if (normalized === AUTH_PRESETS.mentor.email) {
    return { ...AUTH_PRESETS.mentor, isPreset: true };
  }
  if (normalized === AUTH_PRESETS.mentee.email) {
    return { ...AUTH_PRESETS.mentee, isPreset: true };
  }
  if (normalized === AUTH_PRESETS.admin.email) {
    return { ...AUTH_PRESETS.admin, isPreset: true };
  }
  return null;
}
