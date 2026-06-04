import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isDemoAuthEnabled } from '@/lib/app-mode';
import { AUTH_PRESETS } from '@/lib/auth-presets';
import { createSession } from '@/lib/session';

const BodySchema = z.object({
  role: z.enum(['mentee', 'mentor', 'admin']),
});

/**
 * Dev/E2E only — sets astrolink_session cookie without UI server-action redirect.
 * POST /api/e2e/session { "role": "mentee" | "mentor" | "admin" }
 */
export async function POST(request: Request) {
  if (!isDemoAuthEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const { role } = BodySchema.parse(await request.json());
    const preset = AUTH_PRESETS[role];

    await createSession({
      userId: preset.userId,
      email: preset.email,
      role: preset.role,
      fullName: preset.fullName,
      onboarded: true,
    });

    return NextResponse.json({ success: true, role: preset.role });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Session bootstrap failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
