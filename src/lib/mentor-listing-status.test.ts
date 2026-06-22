import { describe, expect, it } from 'vitest';
import {
  canPreviewExpertListing,
  complianceStatusLabel,
  expertProfilePath,
  listingVisibilityCopy,
} from '@/lib/mentor-listing-status';

describe('complianceStatusLabel', () => {
  it('maps known compliance statuses to human labels', () => {
    expect(complianceStatusLabel('approved')).toBe('Approved');
    expect(complianceStatusLabel('pending_review')).toBe('Pending review');
    expect(complianceStatusLabel('document_required')).toBe('Document required');
    expect(complianceStatusLabel('awaiting_human_approval')).toBe('Awaiting human approval');
    expect(complianceStatusLabel('rejected')).toBe('Rejected');
  });

  it('falls back to spaced snake_case for unknown values', () => {
    expect(complianceStatusLabel('custom_status')).toBe('custom status');
  });
});

describe('listingVisibilityCopy', () => {
  it('describes approved mentors by listing state', () => {
    expect(listingVisibilityCopy('approved', true)).toBe('Live on the expert directory');
    expect(listingVisibilityCopy('approved', false)).toBe(
      'Approved but not listed — contact ops',
    );
  });

  it('describes review and compliance blockers', () => {
    expect(listingVisibilityCopy('pending_review', false)).toBe('Under review');
    expect(listingVisibilityCopy('awaiting_human_approval', false)).toBe('Under review');
    expect(listingVisibilityCopy('document_required', false)).toBe(
      'NF-1860 or compliance docs needed',
    );
    expect(listingVisibilityCopy('rejected', false)).toBe('Not approved for listing');
    expect(listingVisibilityCopy('stripe_incomplete', false)).toBe(
      'Complete payout setup to proceed',
    );
  });
});

describe('canPreviewExpertListing', () => {
  it('allows preview only when listed with a slug', () => {
    expect(canPreviewExpertListing(true, 'chris-sembroski')).toBe(true);
    expect(canPreviewExpertListing(true, null)).toBe(false);
    expect(canPreviewExpertListing(true, '  ')).toBe(false);
    expect(canPreviewExpertListing(false, 'chris-sembroski')).toBe(false);
  });
});

describe('expertProfilePath', () => {
  it('builds the public expert profile path', () => {
    expect(expertProfilePath('chris-sembroski')).toBe('/experts/chris-sembroski');
  });
});