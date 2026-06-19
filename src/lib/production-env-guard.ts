/**
 * Fail Vercel Production builds when waitlist prod env is misconfigured.
 * Called from next.config.ts at build time.
 */
export function assertProductionEnvSafety(): void {
  if (process.env.VERCEL_ENV !== 'production') {
    return;
  }

  const demoAuth = process.env.ENABLE_DEMO_AUTH?.trim().toLowerCase();
  if (demoAuth === 'true' || demoAuth === '1') {
    throw new Error(
      'ENABLE_DEMO_AUTH must be false on Vercel Production. Demo auth reopens booking and dashboard surfaces in waitlist mode.',
    );
  }

  if (!process.env.ENCRYPTION_KEY?.trim()) {
    throw new Error('ENCRYPTION_KEY is required on Vercel Production.');
  }
}