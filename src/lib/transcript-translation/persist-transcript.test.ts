import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockMaybeSingle = vi.hoisted(() => vi.fn());
const mockInsert = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockEq = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle }),
      })),
      insert: mockInsert,
      update: vi.fn(() => ({
        eq: mockEq,
      })),
    })),
  },
}));

import {
  countUtterancesFromJson,
  persistSessionTranscript,
} from '@/lib/transcript-translation/persist-transcript';

describe('countUtterancesFromJson', () => {
  it('returns array length for utterance json', () => {
    expect(countUtterancesFromJson([{ id: '1' }, { id: '2' }])).toBe(2);
  });

  it('returns 0 for non-array values', () => {
    expect(countUtterancesFromJson(null)).toBe(0);
    expect(countUtterancesFromJson({})).toBe(0);
  });
});

describe('persistSessionTranscript', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    mockEq.mockResolvedValue({ error: null });
  });

  it('inserts a new transcript row', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const result = await persistSessionTranscript({
      bookingId: 'booking-1',
      vttText: 'WEBVTT',
      utterances: [{ id: '1' } as never],
    });

    expect(result).toEqual({ created: true, upgraded: false });
    expect(mockInsert).toHaveBeenCalled();
  });

  it('treats 23505 unique violation as idempotent no-op', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    mockInsert.mockResolvedValueOnce({ error: { code: '23505', message: 'duplicate' } });

    const result = await persistSessionTranscript({
      bookingId: 'booking-1',
      vttText: 'WEBVTT',
      utterances: [],
    });

    expect(result).toEqual({ created: false, upgraded: false });
  });

  it('upgrades empty transcript when real utterances arrive', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: 'row-1', utterances_json: [] },
      error: null,
    });

    const result = await persistSessionTranscript({
      bookingId: 'booking-1',
      vttText: 'WEBVTT',
      utterances: [{ id: '1' }, { id: '2' }] as never[],
    });

    expect(result).toEqual({ created: false, upgraded: true });
  });

  it('skips when stored transcript already has utterances', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: 'row-1', utterances_json: [{ id: '1' }] },
      error: null,
    });

    const result = await persistSessionTranscript({
      bookingId: 'booking-1',
      vttText: 'WEBVTT',
      utterances: [{ id: '2' }] as never[],
    });

    expect(result).toEqual({ created: false, upgraded: false });
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
