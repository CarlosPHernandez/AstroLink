import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchDailyTranscriptVtt } from '@/lib/transcript-translation/fetch-daily-transcript';

describe('fetchDailyTranscriptVtt', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches access link then downloads VTT text', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ download_link: 'https://cdn.example/vtt' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => 'WEBVTT\n\n1\n00:00:01.000 --> 00:00:02.000\nHello',
      });

    vi.stubGlobal('fetch', fetchMock);

    const vtt = await fetchDailyTranscriptVtt('tx_123', 'daily-key');

    expect(vtt).toContain('WEBVTT');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/transcript/tx_123/access-link');
  });

  it('throws when access-link request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'not found',
      }),
    );

    await expect(fetchDailyTranscriptVtt('tx_missing', 'daily-key')).rejects.toThrow(
      'Daily transcript access-link failed',
    );
  });
});
