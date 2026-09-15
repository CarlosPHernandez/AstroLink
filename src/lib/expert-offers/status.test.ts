import { describe, expect, it } from 'vitest';
import { applyOfferTransition } from '@/lib/expert-offers/status';

describe('applyOfferTransition', () => {
  const now = '2026-09-15T12:00:00.000Z';

  it('draft → published sets published_at once', () => {
    const next = applyOfferTransition(
      { status: 'draft', published_at: null, unpublished_at: null, archived_at: null },
      'publish',
      now,
    );
    expect(next).toEqual({
      status: 'published',
      published_at: now,
      unpublished_at: null,
      archived_at: null,
    });
  });

  it('republish keeps original published_at', () => {
    const next = applyOfferTransition(
      {
        status: 'unpublished',
        published_at: '2026-09-01T00:00:00.000Z',
        unpublished_at: now,
        archived_at: null,
      },
      'publish',
      now,
    );
    expect(next).toMatchObject({
      status: 'published',
      published_at: '2026-09-01T00:00:00.000Z',
      unpublished_at: null,
    });
  });

  it('publish from archived fails', () => {
    expect(
      applyOfferTransition(
        { status: 'archived', published_at: now, unpublished_at: null, archived_at: now },
        'publish',
        now,
      ),
    ).toEqual({ error: 'Archived sessions cannot be published.' });
  });

  it('published → unpublished sets unpublished_at', () => {
    const next = applyOfferTransition(
      {
        status: 'published',
        published_at: '2026-09-01T00:00:00.000Z',
        unpublished_at: null,
        archived_at: null,
      },
      'unpublish',
      now,
    );
    expect(next).toEqual({
      status: 'unpublished',
      published_at: '2026-09-01T00:00:00.000Z',
      unpublished_at: now,
      archived_at: null,
    });
  });

  it('unpublish from draft fails', () => {
    expect(
      applyOfferTransition(
        { status: 'draft', published_at: null, unpublished_at: null, archived_at: null },
        'unpublish',
        now,
      ),
    ).toEqual({ error: 'Only published sessions can be unpublished.' });
  });

  it('archive from published sets archived_at and keeps prior timestamps', () => {
    const next = applyOfferTransition(
      {
        status: 'published',
        published_at: '2026-09-01T00:00:00.000Z',
        unpublished_at: null,
        archived_at: null,
      },
      'archive',
      now,
    );
    expect(next).toEqual({
      status: 'archived',
      published_at: '2026-09-01T00:00:00.000Z',
      unpublished_at: null,
      archived_at: now,
    });
  });
});
