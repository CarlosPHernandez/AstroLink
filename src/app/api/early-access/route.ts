import { NextResponse } from 'next/server';
import { EarlyAccessBodySchema } from '@/lib/waitlist/early-access-schema';
import { formLevelSummary, toFieldErrors } from '@/lib/zod-field-errors';
import {
  assertEarlyAccessRateLimit,
  getEarlyAccessClientKey,
  isEarlyAccessRateLimitError,
} from '@/lib/waitlist/early-access-rate-limit';
import { supabaseAdmin } from '@/lib/supabase';

/** Single opt-in: valid email inserts immediately — no verification email or pending state. */
export async function POST(request: Request) {
  try {
    assertEarlyAccessRateLimit(getEarlyAccessClientKey(request));
    const parsed = EarlyAccessBodySchema.safeParse(await request.json());
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

    const { error } = await supabaseAdmin.from('early_access_signups').insert({
      email: body.email,
      source: 'early-access',
      referrer: body.referrer ?? null,
    });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({
          success: true,
          alreadyRegistered: true,
          message: "You're already on the list. We'll be in touch soon.",
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      alreadyRegistered: false,
      message: "You're on the list. We'll reach out when early access opens.",
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
    const message = error instanceof Error ? error.message : 'Signup failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

