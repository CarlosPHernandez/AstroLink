import { describe, expect, it } from 'vitest';
import {
  resolveRecapDisplay,
  UNGROUNDED_RECAP_COPY,
} from './session-recap-honesty-display';

describe('resolveRecapDisplay', () => {
  it('shows a recap only when a stored transcript exists', () => {
    expect(
      resolveRecapDisplay({ hasRecap: true, transcriptAvailable: true }),
    ).toEqual({ showRecap: true, grounded: true, banner: null });
  });

  it('hides an ungrounded template recap', () => {
    expect(
      resolveRecapDisplay({ hasRecap: true, transcriptAvailable: false }),
    ).toEqual({
      showRecap: false,
      grounded: false,
      banner: UNGROUNDED_RECAP_COPY,
    });
  });

  it('does not show a recap when none exists', () => {
    expect(
      resolveRecapDisplay({ hasRecap: false, transcriptAvailable: false }),
    ).toEqual({
      showRecap: false,
      grounded: false,
      banner: UNGROUNDED_RECAP_COPY,
    });
  });
});
