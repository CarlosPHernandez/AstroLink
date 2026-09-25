import { NextResponse } from 'next/server';
import { z } from 'zod';

import { completeProfileMediaUpload, loadMediaMentor } from '@/lib/expert-profile-media-store';

const bodySchema = z.object({
  kind: z.enum(['portrait', 'intro']),
  path: z.string().min(1).max(180),
});

export async function POST(request: Request) {
  const loaded = await loadMediaMentor();
  if (!loaded.ok) {
    return NextResponse.json({ success: false, error: loaded.error }, { status: loaded.status });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Check the highlighted fields.' }, { status: 400 });
  }

  try {
    const saved = await completeProfileMediaUpload({
      mentor: loaded.mentor,
      kind: parsed.data.kind,
      path: parsed.data.path,
    });
    return NextResponse.json({ success: true, ...saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save your profile media.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
