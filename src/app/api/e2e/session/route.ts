import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSession } from '@/lib/session';

/** Match seed + auth presets until Supabase Auth ships */
const PRESETS = {
  mentee: {
    userId: 'a0000001-0000-4000-8000-000000000001',
    email: 'carlos@astrolink.ai',
    fullName: 'Carlos Hernandez',
    role: 'mentee' as const,
  },
  mentor: {
    userId: 'a0000002-0000-4000-8000-000000000002',
    email: 'chris@astrolink.ai',
    fullName: 'Chris Sembroski',
    role: 'mentor' as const,
  },
  admin: {
    userId: 'a0000003-0000-4000-8000-000000000003',
    email: 'admin@astrolink.ai',
    fullName: 'Flight Command',
    role: 'admin' as const,
  },
};

const BodySchema = z.object({
  role: z.enum(['mentee', 'mentor', 'admin']),
});

/**
 * Dev/E2E only — sets astrolink_session cookie without UI server-action redirect.
 * POST /api/e2e/session { "role": "mentee" | "mentor" | "admin" }
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const { role } = BodySchema.parse(await request.json());
    const preset = PRESETS[role];

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
