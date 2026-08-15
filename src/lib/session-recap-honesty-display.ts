/** Recap is only shown as a session recap when a stored transcript exists. */

export const UNGROUNDED_RECAP_COPY =
  'A written recap will appear here once a stored transcript is available. Live captions alone are not enough.';

export type RecapDisplayState = {
  showRecap: boolean;
  grounded: boolean;
  banner: string | null;
};

export function resolveRecapDisplay(input: {
  hasRecap: boolean;
  transcriptAvailable: boolean;
}): RecapDisplayState {
  if (input.hasRecap && input.transcriptAvailable) {
    return { showRecap: true, grounded: true, banner: null };
  }
  return {
    showRecap: false,
    grounded: false,
    banner: UNGROUNDED_RECAP_COPY,
  };
}
