import { NextResponse } from 'next/server';
import { EarlyAccessBodySchema } from '@/lib/waitlist/early-access-schema';
import { formLevelSummary, toFieldErrors } from '@/lib/zod-field-errors';
import {
  assertEarlyAccessRateLimit,
  getEarlyAccessClientKey,
  isEarlyAccessRateLimitError,
} from '@/lib/waitlist/early-access-rate-limit';
import { supabaseAdmin } from '@/lib/supabase';

const MAX_BODY_BYTES = 4096;
const GENERIC_SERVER_ERROR = 'Something went wrong. Try again.';
const SUCCESS_MESSAGE = "You're on the list. We'll reach out when early access opens.";

/** Single opt-in: valid email inserts immediately — no verification email or pending state. */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 415 });
    }

    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const length = Number.parseInt(contentLength, 10);
      if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
        return NextResponse.json({ success: false, error: 'Request too large.' }, { status: 413 });
      }
    }

    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json({ success: false, error: 'Request too large.' }, { status: 413 });
    }

    let json: unknown;
    try {
      json = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
    }

    const parsed = EarlyAccessBodySchema.safeParse(json);
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
    const body = parsed.data;

    await assertEarlyAccessRateLimit(request, body.email);

    const { error } = await supabaseAdmin.from('early_access_signups').insert({
      email: body.email,
      source: 'early-access',
      referrer: body.referrer ?? null,
    });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({
          success: true,
          message: SUCCESS_MESSAGE,
        });
      }
      console.error('[early-access] signup insert failed', {
        code: error.code,
        clientKey: getEarlyAccessClientKey(request),
      });
      return NextResponse.json({ success: false, error: GENERIC_SERVER_ERROR }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: SUCCESS_MESSAGE,
    });
  } catch (error: unknown) {
    if (isEarlyAccessRateLimitError(error)) {
      return NextResponse.json(
        { success: false, error: error.message },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(error.retryAfterMs / 1000)),
          },
        },
      );
    }
    console.error(
      '[early-access] signup failed',
      error instanceof Error ? error.message : 'unknown',
    );
    return NextResponse.json({ success: false, error: GENERIC_SERVER_ERROR }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}