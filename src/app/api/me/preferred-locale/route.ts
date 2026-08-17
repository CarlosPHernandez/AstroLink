import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSession } from '@/lib/session';
import { updatePreferredLocale } from '@/lib/user-profile';
import { SUPPORTED_TARGET_LOCALES } from '@/lib/transcript-translation/types';

const BodySchema = z.object({
  locale: z.enum(SUPPORTED_TARGET_LOCALES),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.role !== 'mentee') {
    return NextResponse.json({ error: 'Only buyers can set caption language.' }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Select a supported language.' }, { status: 400 });
  }

  const locale = await updatePreferredLocale(session.userId, parsed.data.locale);
  if (!locale) {
    return NextResponse.json({ error: 'Could not save language.' }, { status: 500 });
  }

  return NextResponse.json({ locale });
}
