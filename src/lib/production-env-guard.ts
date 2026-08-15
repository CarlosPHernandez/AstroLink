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

  const stubLlm = process.env.E2E_STUB_LLM?.trim().toLowerCase();
  if (stubLlm === 'true' || stubLlm === '1') {
    throw new Error('E2E_STUB_LLM must not be true on Vercel Production.');
  }

  const explicit = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (!explicit && process.env.OPENAI_API_KEY?.trim()) {
    throw new Error(
      'LLM_PROVIDER must be set on Vercel Production when OPENAI_API_KEY is present. Unset provider silently routes to OpenAI.',
    );
  }
}