import { describe, expect, it } from 'vitest';
import {
  CHRIS_PUBLIC_REFERRER,
  CHRIS_WAITLIST_EMAIL_REFERRER,
  parseChrisCampaignReferrer,
} from '@/lib/chris-campaign/chris-campaign-referrer';

describe('chris-campaign-referrer', () => {
  it('parses valid Chris public ref', () => {
    expect(parseChrisCampaignReferrer('?ref=chris-sembroski')).toBe(CHRIS_PUBLIC_REFERRER);
  });

  it('parses waitlist email split ref', () => {
    expect(parseChrisCampaignReferrer('?ref=early-signups')).toBe(CHRIS_WAITLIST_EMAIL_REFERRER);
  });

  it('rejects invalid ref values', () => {
    expect(parseChrisCampaignReferrer('?ref=<script>')).toBeUndefined();
  });
});
