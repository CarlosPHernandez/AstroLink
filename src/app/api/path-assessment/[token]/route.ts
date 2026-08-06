import { NextResponse } from 'next/server';
import {
  PathAssessmentAnswersSchema,
  PathAssessmentReportSchema,
  type PathAssessmentPublicView,
  type PathAssessmentStatus,
} from '@/lib/path-assessment/schema';
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
    .select(
      'public_token, status, first_name, answers_json, report_json, report_html, created_at',
    )
    .eq('public_token', token)
    .maybeSingle();

  if (error) {
    console.error('[api/path-assessment/token]', error.message);
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  if (!data) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  const answersParsed = PathAssessmentAnswersSchema.safeParse(data.answers_json);
  if (!answersParsed.success) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  let report = null;
  if (data.report_json) {
    const reportParsed = PathAssessmentReportSchema.safeParse(data.report_json);
    if (reportParsed.success) {
      report = reportParsed.data;
    }
  }

  const status = (['pending', 'ready', 'failed'].includes(data.status)
    ? data.status
    : 'pending') as PathAssessmentStatus;

  const view: PathAssessmentPublicView = {
    token: data.public_token,
    status,
    firstName: data.first_name,
    answers: answersParsed.data,
    report,
    reportHtml: data.report_html,
    createdAt: data.created_at,
  };

  return NextResponse.json({ success: true, data: view });
}
