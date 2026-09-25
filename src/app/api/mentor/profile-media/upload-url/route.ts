import { NextResponse } from 'next/server';
import { z } from 'zod';

import { ProfileMediaRateLimitError } from '@/lib/expert-profile-media';
import { createProfileMediaUpload, loadMediaMentor } from '@/lib/expert-profile-media-store';

const bodySchema = z.object({
  kind: z.enum(['portrait', 'intro']),
  contentType: z.string().min(1).max(80),
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
    const upload = await createProfileMediaUpload({
      mentor: loaded.mentor,
      kind: parsed.data.kind,
      contentType: parsed.data.contentType,
    });
    return NextResponse.json({ success: true, ...upload });
  } catch (error) {
    if (error instanceof ProfileMediaRateLimitError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 429 });
    }
    const message = error instanceof Error ? error.message : 'Could not start the upload.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
