export type EarlyAccessSuccessDisplay = {
  headline: string;
  body: string;
};

/** Public success copy — same for new and duplicate signups (no enumeration). */
export function getEarlyAccessSuccessDisplay(): EarlyAccessSuccessDisplay {
  return {
    headline: "You're on the list",
    body: "We'll reach out when early access opens.",
  };
}