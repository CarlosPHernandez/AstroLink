import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockMentorMaybeSingle = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: mockMentorMaybeSingle,
            })),
          })),
        })),
      })),
    })),
  },
}));

import { resolveChrisCampaignForBooking } from '@/lib/chris-campaign/validate-chris-booking';

const chrisMentorId = 'a0000002-0000-4000-8000-000000000002';

describe('resolveChrisCampaignForBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMentorMaybeSingle.mockResolvedValue({
      data: { id: chrisMentorId },
      error: null,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns undefined when campaign is omitted', async () => {
    await expect(resolveChrisCampaignForBooking({})).resolves.toBeUndefined();
    expect(mockMentorMaybeSingle).not.toHaveBeenCalled();
  });

  it('returns campaign and mentor ids when Chris booking is enabled', async () => {
    vi.stubEnv('CHRIS_BOOKING_ENABLED', 'true');
    await expect(
      resolveChrisCampaignForBooking({ campaign: 'chris', mentorId: chrisMentorId }),
    ).resolves.toEqual({
      campaignId: 'chris-sembroski',
      mentorId: chrisMentorId,
    });
  });

  it('resolves Chris mentor when mentorId is omitted', async () => {
    vi.stubEnv('CHRIS_BOOKING_ENABLED', 'true');
    await expect(resolveChrisCampaignForBooking({ campaign: 'chris' })).resolves.toEqual({
      campaignId: 'chris-sembroski',
      mentorId: chrisMentorId,
    });
  });

  it('rejects unknown campaign values', async () => {
    vi.stubEnv('CHRIS_BOOKING_ENABLED', 'true');
    await expect(
      resolveChrisCampaignForBooking({ campaign: 'other' as 'chris' }),
    ).rejects.toThrow('Unknown booking campaign.');
  });

  it('rejects when Chris booking flag is off', async () => {
    await expect(resolveChrisCampaignForBooking({ campaign: 'chris' })).rejects.toThrow(
      'Chris sessions are not available right now.',
    );
  });

  it('rejects mentor mismatch', async () => {
    vi.stubEnv('CHRIS_BOOKING_ENABLED', 'true');
    await expect(
      resolveChrisCampaignForBooking({
        campaign: 'chris',
        mentorId: 'a0000001-0000-4000-8000-000000000001',
      }),
    ).rejects.toThrow('This offer is only available with Chris Sembroski.');
  });
});