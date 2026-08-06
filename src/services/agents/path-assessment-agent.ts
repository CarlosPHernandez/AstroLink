import 'server-only';

import type { Json } from '@/lib/database.types';
import { sendEmail } from '@/lib/email/resend-client';
import { buildPathAssessmentEmail } from '@/lib/email/path-assessment-templates';
import { buildFallbackPathAssessmentReport } from '@/lib/path-assessment/fallback-report';
import {
  buildPathAssessmentUserPrompt,
  PATH_ASSESSMENT_REPORT_SCHEMA,
  PATH_ASSESSMENT_SYSTEM_INSTRUCTION,
} from '@/lib/path-assessment/prompts';
import { pathAssessmentBookingUrl } from '@/lib/path-assessment/public-url.server';
import {
  coercePathAssessmentReport,
  renderPathAssessmentReportHtml,
} from '@/lib/path-assessment/render-report';
import type {
  PathAssessmentAnswers,
  PathAssessmentReport,
} from '@/lib/path-assessment/schema';
import { generatePathAssessmentPublicToken } from '@/lib/path-assessment/tokens';
import {
  callLlmWithBackoff,
  generateStructuredJson,
  llmFlashModel,
} from '@/lib/llm';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * APX-10 — Space Path Assessment (free funnel).
 * Prefer Gemini for XPRIZE demos (`LLM_PROVIDER=gemini` + `GEMINI_API_KEY`).
 * On LLM failure, still returns a ready report via deterministic fallback.
 */
export class PathAssessmentAgent {
  private agentId = 'APX-10' as const;

  async createAndGenerate(params: {
    answers: PathAssessmentAnswers;
    userId?: string | null;
  }): Promise<{ token: string; status: 'ready' | 'failed'; assessmentId: string }> {
    const publicToken = generatePathAssessmentPublicToken();
    const answersJson = params.answers as unknown as Json;

    const { data: row, error: insertErr } = await supabaseAdmin
      .from('path_assessments')
      .insert({
        public_token: publicToken,
        email: params.answers.email.trim().toLowerCase(),
        first_name: params.answers.firstName.trim(),
        answers_json: answersJson,
        status: 'pending',
        user_id: params.userId ?? null,
      })
      .select('id, public_token')
      .single();

    if (insertErr || !row) {
      throw new Error(
        `Failed to create path assessment: ${insertErr?.message ?? 'no row returned'}`,
      );
    }

    await this.logAudit('PATH_ASSESSMENT_CREATED', row.id, {
      public_token: publicToken,
      email: params.answers.email,
    });

    const { report, usedFallback, llmError } = await this.generateReport(
      params.answers,
      row.id,
    );

    const reportHtml = renderPathAssessmentReportHtml(report, {
      firstName: params.answers.firstName,
      bookingUrl: pathAssessmentBookingUrl(publicToken),
      includeLiveCta: true,
    });

    // Prefer status ready even when LLM failed so UX never dead-ends.
    const status = 'ready' as const;

    const { error: updateErr } = await supabaseAdmin
      .from('path_assessments')
      .update({
        report_json: report as unknown as Json,
        report_html: reportHtml,
        status,
        llm_error: usedFallback ? llmError ?? 'llm_fallback' : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);

    if (updateErr) {
      throw new Error(`Failed to save path assessment report: ${updateErr.message}`);
    }

    await this.logAudit(
      usedFallback ? 'PATH_ASSESSMENT_FALLBACK' : 'PATH_ASSESSMENT_READY',
      row.id,
      { used_fallback: usedFallback, llm_error: llmError ?? null },
    );

    // Email is best-effort; page results still work via token.
    try {
      await this.sendReportEmail({
        assessmentId: row.id,
        email: params.answers.email,
        firstName: params.answers.firstName,
        token: publicToken,
        report,
      });
    } catch (emailErr) {
      console.warn('[path-assessment] email send failed (non-fatal)', emailErr);
    }

    return { token: publicToken, status, assessmentId: row.id };
  }

  private async generateReport(
    answers: PathAssessmentAnswers,
    assessmentId: string,
  ): Promise<{
    report: PathAssessmentReport;
    usedFallback: boolean;
    llmError: string | null;
  }> {
    const fallback = buildFallbackPathAssessmentReport(answers);

    try {
      const raw = await callLlmWithBackoff(() =>
        generateStructuredJson<PathAssessmentReport>({
          model: llmFlashModel,
          rateLimitKey: `path-assessment:${assessmentId}`,
          systemInstruction: PATH_ASSESSMENT_SYSTEM_INSTRUCTION,
          prompt: buildPathAssessmentUserPrompt(answers),
          schema: PATH_ASSESSMENT_REPORT_SCHEMA,
          audit: {
            agentId: this.agentId,
            operation: 'space_path_assessment',
            refId: assessmentId,
          },
        }),
      );

      return {
        report: coercePathAssessmentReport(raw, fallback),
        usedFallback: false,
        llmError: null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'LLM failed';
      console.warn('[path-assessment] LLM failed; using fallback report', message);
      return {
        report: fallback,
        usedFallback: true,
        llmError: message.slice(0, 500),
      };
    }
  }

  private async sendReportEmail(params: {
    assessmentId: string;
    email: string;
    firstName: string;
    token: string;
    report: PathAssessmentReport;
  }): Promise<void> {
    const { subject, html } = buildPathAssessmentEmail({
      firstName: params.firstName,
      token: params.token,
      report: params.report,
    });

    const result = await sendEmail({
      to: params.email,
      subject,
      html,
    });

    if ('ok' in result && result.ok) {
      await supabaseAdmin
        .from('path_assessments')
        .update({
          email_sent_at: new Date().toISOString(),
          email_message_id: result.messageId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.assessmentId);
      await this.logAudit('PATH_ASSESSMENT_EMAIL_SENT', params.assessmentId, {
        message_id: result.messageId,
      });
      return;
    }

    if ('skipped' in result && result.skipped) {
      await this.logAudit('PATH_ASSESSMENT_EMAIL_SKIPPED', params.assessmentId, {
        reason: result.reason,
      });
      return;
    }

    const errMsg = 'error' in result ? result.error : 'email failed';
    await this.logAudit('PATH_ASSESSMENT_EMAIL_FAILED', params.assessmentId, {
      error: errMsg,
    });
  }

  private async logAudit(event: string, refId: string | null, payload: Record<string, unknown>) {
    await supabaseAdmin.from('audit_log').insert({
      agent_id: this.agentId,
      event,
      ref_id: refId,
      payload: payload as Json,
    });
  }
}
