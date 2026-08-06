import { NextResponse } from 'next/server';
import {
  assertPathAssessmentSubmitRateLimit,
  getPathAssessmentClientIp,
  isPathAssessmentRateLimitError,
} from '@/lib/path-assessment/rate-limit';
import { PathAssessmentSubmitBodySchema } from '@/lib/path-assessment/schema';
import { formLevelSummary, toFieldErrors } from '@/lib/zod-field-errors';
import { getSession } from '@/lib/session';
import { PathAssessmentAgent } from '@/services/agents/path-assessment-agent';

export const runtime = 'nodejs';

/**
 * POST /api/path-assessment
 * Free Space Path Assessment — no account required.
 * Requires GEMINI_API_KEY (or OPENAI) for LLM; falls back to structured report if LLM fails.
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = PathAssessmentSubmitBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: formLevelSummary(),
        fieldErrors: toFieldErrors(parsed.error),
      },
      { status: 400 },
    );
  }

  // Honeypot: bots fill hidden fields — soft success with no side effects
  if (parsed.data.website?.trim()) {
    return NextResponse.json({
      success: true,
      token: 'honeypot',
      status: 'ready',
    });
  }

  const { website: _website, ...answers } = parsed.data;
  const ip = getPathAssessmentClientIp(request);

  try {
    assertPathAssessmentSubmitRateLimit(ip, answers.email);
  } catch (error) {
    if (isPathAssessmentRateLimitError(error)) {
      return NextResponse.json(
        { success: false, error: error.message },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(error.retryAfterMs / 1000)) },
        },
      );
    }
    throw error;
  }

  try {
    const session = await getSession().catch(() => null);
    const agent = new PathAssessmentAgent();
    const result = await agent.createAndGenerate({
      answers,
      userId: session?.userId ?? null,
    });

    return NextResponse.json({
      success: true,
      token: result.token,
      status: result.status,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Could not generate your assessment. Try again.';
    console.error('[api/path-assessment]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
