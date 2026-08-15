import { NextResponse } from 'next/server';
import {
  mapPathAssessmentPublicView,
  PATH_ASSESSMENT_PUBLIC_SELECT,
} from '@/lib/path-assessment/public-view';
import type { PathAssessmentPublicView } from '@/lib/path-assessment/schema';
import { isValidPathAssessmentToken } from '@/lib/path-assessment/tokens';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

/**
 * GET /api/path-assessment/[token]
 * Public read by unguessable token — answers + report only (no internal UUID).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token: rawToken } = await context.params;
  const token = rawToken?.trim() ?? '';

  if (!token || !isValidPathAssessmentToken(token)) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin
    .from('path_assessments')
    .select(PATH_ASSESSMENT_PUBLIC_SELECT)
    .eq('public_token', token)
    .maybeSingle();

  if (error) {
    console.error('[api/path-assessment/token]', error.message);
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  if (!data) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  const view: PathAssessmentPublicView | null = mapPathAssessmentPublicView(
    data as Parameters<typeof mapPathAssessmentPublicView>[0],
  );
  if (!view) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: view });
}
