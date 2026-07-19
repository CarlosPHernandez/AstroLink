/** Profile duration stepper: 15–60 min in 15-min steps (12 segment bars = 3 per step). */
export const SESSION_DURATION_MIN = 15;
export const SESSION_DURATION_MAX = 60;
export const SESSION_DURATION_STEP = 15;
export const SESSION_DURATION_DEFAULT = 30;
export const SESSION_DURATION_SEGMENTS = 12;

export function clampSessionDurationMinutes(minutes: number): number {
  const raw = Math.floor(Number.isFinite(minutes) ? minutes : SESSION_DURATION_DEFAULT);
  const stepped =
    Math.round((raw - SESSION_DURATION_MIN) / SESSION_DURATION_STEP) * SESSION_DURATION_STEP +
    SESSION_DURATION_MIN;
  return Math.max(SESSION_DURATION_MIN, Math.min(SESSION_DURATION_MAX, stepped));
}

export function filledSegmentCount(minutes: number): number {
  const clamped = clampSessionDurationMinutes(minutes);
  const steps = (clamped - SESSION_DURATION_MIN) / SESSION_DURATION_STEP + 1;
  return steps * (SESSION_DURATION_SEGMENTS / ((SESSION_DURATION_MAX - SESSION_DURATION_MIN) / SESSION_DURATION_STEP + 1));
}

export function formatUsdFromCents(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}
