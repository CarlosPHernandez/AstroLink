import { describe, expect, it } from 'vitest';
import { AUTH_PRESETS, DEMO_MENTOR_PRESET, resolvePresetLogin } from '@/lib/auth-presets';

describe('resolvePresetLogin', () => {
  it('resolves demo mentor Gmail for dual-device video', () => {
    const result = resolvePresetLogin('  Carlosphernandez2020@gmail.com  ');
    expect(result).toEqual({
      ...DEMO_MENTOR_PRESET,
      isPreset: true,
    });
  });

  it('resolves primary role presets', () => {
    expect(resolvePresetLogin(AUTH_PRESETS.mentee.email)?.userId).toBe(AUTH_PRESETS.mentee.userId);
    expect(resolvePresetLogin(AUTH_PRESETS.mentor.email)?.userId).toBe(AUTH_PRESETS.mentor.userId);
  });

  it('returns null for unknown email', () => {
    expect(resolvePresetLogin('unknown@example.com')).toBeNull();
  });
});
