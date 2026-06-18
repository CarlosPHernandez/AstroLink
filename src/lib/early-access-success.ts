export type EarlyAccessSuccessDisplay = {
  headline: string;
  body: string;
};

export function getEarlyAccessSuccessDisplay(
  alreadyRegistered: boolean,
): EarlyAccessSuccessDisplay {
  if (alreadyRegistered) {
    return {
      headline: "You're already on the list",
      body: 'We have your email—no need to sign up again.',
    };
  }
  return {
    headline: "You're on the list",
    body: "We'll reach out when early access opens.",
  };
}