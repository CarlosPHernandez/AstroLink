import { describe, expect, it, vi, beforeEach } from 'vitest';

const trackMock = vi.fn();

vi.mock('@vercel/analytics', () => ({
  track: (...args: unknown[]) => trackMock(...args),
}));

describe('path-assessment-analytics', () => {
  beforeEach(() => {
    trackMock.mockReset();
  });

  it('classifies submit failures without leaking messages', async () => {
    const { classifySpaSubmitFail } = await import('./path-assessment-analytics');
    expect(classifySpaSubmitFail(429, 'Too many')).toBe('rate_limit');
    expect(classifySpaSubmitFail(400, 'bad')).toBe('validation');
    expect(classifySpaSubmitFail(0, 'network error')).toBe('network');
    expect(classifySpaSubmitFail(500, 'oops')).toBe('server');
  });

  it('tracks funnel events without PII fields', async () => {
    const {
      trackSpaFormView,
      trackSpaFormStep,
      trackSpaCtaLiveClick,
      trackSpaWrittenCheckoutSuccess,
    } = await import('./path-assessment-analytics');

    trackSpaFormView();
    trackSpaFormStep(3);
    trackSpaCtaLiveClick('results');
    trackSpaWrittenCheckoutSuccess(true);

    expect(trackMock).toHaveBeenCalledWith('spa_form_view', { surface: 'form' });
    expect(trackMock).toHaveBeenCalledWith('spa_form_step', { surface: 'form', step: 3 });
    expect(trackMock).toHaveBeenCalledWith('spa_cta_live_click', { surface: 'results' });
    expect(trackMock).toHaveBeenCalledWith('spa_written_checkout_success', {
      surface: 'written',
      skip_stripe: true,
    });

    for (const call of trackMock.mock.calls) {
      const payload = call[1] as Record<string, unknown>;
      expect(payload).not.toHaveProperty('email');
      expect(payload).not.toHaveProperty('token');
      expect(JSON.stringify(payload)).not.toMatch(/@/);
    }
  });
});
