import {
  PathAssessmentAnswersSchema,
  PathAssessmentReportSchema,
  type PathAssessmentPublicView,
  type PathAssessmentStatus,
} from '@/lib/path-assessment/schema';

type AssessmentRow = {
  public_token: string;
  status: string;
  first_name: string;
  answers_json: unknown;
  report_json: unknown;
  report_html: string | null;
  created_at: string;
  llm_error: string | null;
  match_reason: string | null;
  mentors?: { id: string; slug: string | null; full_name: string } | null;
};

export function mapPathAssessmentPublicView(data: AssessmentRow): PathAssessmentPublicView | null {
  const answersParsed = PathAssessmentAnswersSchema.safeParse(data.answers_json);
  if (!answersParsed.success) {
    return null;
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

  const usedFallback = Boolean(data.llm_error);
  const mentor = data.mentors;
  const recommendedMentor =
    mentor && data.match_reason
      ? {
          id: mentor.id,
          slug: mentor.slug,
          fullName: mentor.full_name,
          matchReason: data.match_reason,
        }
      : null;

  return {
    token: data.public_token,
    status,
    firstName: data.first_name,
    answers: answersParsed.data,
    report,
    reportHtml: data.report_html,
    createdAt: data.created_at,
    usedFallback,
    recommendedMentor,
  };
}

export const PATH_ASSESSMENT_PUBLIC_SELECT =
  'public_token, status, first_name, answers_json, report_json, report_html, created_at, llm_error, match_reason, mentors:recommended_mentor_id(id, slug, full_name)';
