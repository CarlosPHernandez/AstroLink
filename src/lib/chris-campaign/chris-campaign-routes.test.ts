import { describe, expect, it } from 'vitest';
import { isChrisCampaignBookingEntry } from '@/lib/chris-campaign/chris-campaign-routes';

describe('isChrisCampaignBookingEntry', () => {
  it('allows signed-out Chris wizard URLs when campaign is enabled', () => {
    expect(
      isChrisCampaignBookingEntry('/booking', 'chris', { chrisBookingEnabled: true }),
    ).toBe(true);
    expect(
      isChrisCampaignBookingEntry(
        '/booking',
        'chris',
        { chrisBookingEnabled: true },
      ),
    ).toBe(true);
  });

  it('blocks generic booking and disabled campaign', () => {
    expect(
      isChrisCampaignBookingEntry('/booking', null, { chrisBookingEnabled: true }),
    ).toBe(false);
    expect(
      isChrisCampaignBookingEntry('/booking', 'chris', { chrisBookingEnabled: false }),
    ).toBe(false);
    expect(
      isChrisCampaignBookingEntry('/auth', 'chris', { chrisBookingEnabled: true }),
    ).toBe(false);
  });
});