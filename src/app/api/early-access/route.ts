import { NextResponse } from 'next/server';
import { z } from 'zod';
import { EarlyAccessBodySchema } from '@/lib/early-access-schema';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = EarlyAccessBodySchema.parse(await request.json());

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
    const message = error instanceof Error ? error.message : 'Signup failed';
    const status = error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
