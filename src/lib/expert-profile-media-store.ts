import 'server-only';

import { requireActivatedMentor } from '@/lib/mentor-activation/require-activated-mentor';
import { revalidateMentorDirectory } from '@/lib/revalidate-mentors';
import { supabaseAdmin } from '@/lib/supabase';
import {
  INTRO_MAX_BYTES,
  PORTRAIT_MAX_BYTES,
  ProfileMediaRateLimitError,
  assertProfileMediaRateLimit,
  introHeaderOk,
  isExactOwnedMediaPath,
  isPublicExpertSlug,
  mediaObjectPath,
  portraitHeaderOk,
  publicMediaUrl,
  type ProfileMediaKind,
} from '@/lib/expert-profile-media';

const BUCKET = 'expert-intro-videos';

export type MediaMentor = { id: string; slug: string };

export async function loadMediaMentor(): Promise<
  | { ok: true; mentor: MediaMentor }
  | { ok: false; status: number; error: string }
> {
  const gate = await requireActivatedMentor();
  if (!gate.ok) {
    return { ok: false, status: 401, error: gate.message };
  }

  const byId = await supabaseAdmin
    .from('mentors')
    .select('id, slug')
    .eq('id', gate.session.userId)
    .maybeSingle();
  let row = byId.data;
  if (!row && gate.session.email) {
    const byEmail = await supabaseAdmin
      .from('mentors')
      .select('id, slug')
      .eq('email', gate.session.email)
      .maybeSingle();
    row = byEmail.data;
  }
  if (!row?.id || !row.slug || !isPublicExpertSlug(row.slug)) {
    return { ok: false, status: 400, error: 'Your public link is not ready yet.' };
  }
  return { ok: true, mentor: { id: row.id, slug: row.slug } };
}

export async function createProfileMediaUpload(input: {
  mentor: MediaMentor;
  kind: ProfileMediaKind;
  contentType: string;
}): Promise<{ path: string; token: string; signedUrl: string }> {
  const path = mediaObjectPath(input.mentor.slug, input.kind, input.contentType);
  if (!path) {
    throw new Error('Use a JPG, PNG, or WEBP photo, or an MP4, WEBM, or MOV video.');
  }
  try {
    assertProfileMediaRateLimit(input.mentor.id);
  } catch (error) {
    if (error instanceof ProfileMediaRateLimitError) throw error;
    throw error;
  }
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path, {
    upsert: true,
  });
  if (error || !data) {
    throw new Error('Could not start the upload.');
  }
  return { path, token: data.token, signedUrl: data.signedUrl };
}

async function objectSize(slug: string, fileName: string): Promise<number | null> {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).list(slug, { search: fileName });
  if (error || !data) return null;
  const match = data.find((item) => item.name === fileName);
  const size = match?.metadata?.size;
  return typeof size === 'number' ? size : null;
}

async function headerBytes(publicUrl: string): Promise<Uint8Array | null> {
  const response = await fetch(publicUrl, { headers: { Range: 'bytes=0-31' } });
  if (!response.ok && response.status !== 206) return null;
  return new Uint8Array(await response.arrayBuffer());
}

export async function completeProfileMediaUpload(input: {
  mentor: MediaMentor;
  kind: ProfileMediaKind;
  path: string;
}): Promise<{ imageUrl?: string; introVideoUrl?: string }> {
  if (!isExactOwnedMediaPath(input.mentor.slug, input.kind, input.path)) {
    throw new Error('That file is not yours to save.');
  }
  const fileName = input.path.slice(input.path.lastIndexOf('/') + 1);
  const size = await objectSize(input.mentor.slug, fileName);
  const max = input.kind === 'portrait' ? PORTRAIT_MAX_BYTES : INTRO_MAX_BYTES;
  if (size == null || size <= 0 || size > max) {
    await supabaseAdmin.storage.from(BUCKET).remove([input.path]);
    throw new Error(
      input.kind === 'portrait' ? 'Photo must be 5 MB or smaller.' : 'Video must be 100 MB or smaller.',
    );
  }

  const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(input.path);
  const bytes = await headerBytes(pub.publicUrl);
  const headerOk = bytes
    ? input.kind === 'portrait'
      ? portraitHeaderOk(bytes)
      : introHeaderOk(bytes)
    : false;
  if (!headerOk) {
    await supabaseAdmin.storage.from(BUCKET).remove([input.path]);
    throw new Error('That file is not a supported photo or video.');
  }

  const url = publicMediaUrl(pub.publicUrl, Date.now());
  const patch =
    input.kind === 'portrait' ? { image_url: url } : { intro_video_url: url };
  const { error } = await supabaseAdmin.from('mentors').update(patch).eq('id', input.mentor.id);
  if (error) {
    throw new Error('Could not save your profile media.');
  }
  revalidateMentorDirectory();
  return input.kind === 'portrait' ? { imageUrl: url } : { introVideoUrl: url };
}
