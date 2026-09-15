import type { ExpertOfferStatus } from '@/lib/expert-offers/types';

export type OfferTimestamps = {
  status: ExpertOfferStatus;
  published_at: string | null;
  unpublished_at: string | null;
  archived_at: string | null;
};

export function applyOfferTransition(
  current: OfferTimestamps,
  action: 'publish' | 'unpublish' | 'archive',
  nowIso: string,
): OfferTimestamps | { error: string } {
  if (action === 'archive') {
    return {
      status: 'archived',
      published_at: current.published_at,
      unpublished_at: current.unpublished_at,
      archived_at: nowIso,
    };
  }
  if (current.status === 'archived') {
    return { error: 'Archived sessions cannot be published.' };
  }
  if (action === 'publish') {
    if (current.status !== 'draft' && current.status !== 'unpublished') {
      return { error: 'Only draft or unpublished sessions can be published.' };
    }
    return {
      status: 'published',
      published_at: current.published_at ?? nowIso,
      unpublished_at: null,
      archived_at: null,
    };
  }
  if (current.status !== 'published') {
    return { error: 'Only published sessions can be unpublished.' };
  }
  return {
    status: 'unpublished',
    published_at: current.published_at,
    unpublished_at: nowIso,
    archived_at: null,
  };
}
