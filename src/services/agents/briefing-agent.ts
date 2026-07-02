import type { Json } from '@/lib/database.types';
import {
  DUAL_SESSION_BRIEFING_SCHEMA,
  DUAL_SESSION_BRIEFING_SYSTEM_INSTRUCTION,
} from '@/lib/briefing-prompts';
import { callLlmWithBackoff, generateStructuredJson, llmProModel } from '@/lib/llm';
import { supabaseAdmin } from '@/lib/supabase';
import { PreCallBriefOutput, SessionBriefingBundle } from '@/lib/types';

export class BriefingAgent {
  private agentId = 'APX-02' as const;

  /**
   * Prepares session briefings or a pre-call brief package depending on service type.
   */
  async prepareBriefing(bookingId: string) {
    await this.logAudit('BRIEFING_START', bookingId, {});

    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .select('*, users(*), mentors(*)')
      .eq('id', bookingId)
      .single();

    if (bookingErr || !booking) {
      throw new Error(`Failed to load booking: ${bookingErr?.message}`);
    }

    const { service_type } = booking;

    if (service_type === 'session_1on1' || service_type === 'extended_session') {
      const briefing = await this.generateDualSessionBriefing({
        bookingId,
        rateLimitKey: booking.mentee_id,
        buyerName: booking.users.full_name,
        buyerGoals: booking.match_reason || '',
        buyerBackground: booking.intake_background || '',
        expertName: booking.mentors.full_name,
        expertExpertise: booking.mentors.expertise.join(', '),
      });

      await supabaseAdmin
        .from('bookings')
        .update({ briefing_json: briefing as unknown as Json })
        .eq('id', bookingId);

      await this.logAudit('BRIEFING_GENERATED', bookingId, { briefing });
      return briefing;
    }

    if (service_type === 'pre_call_brief') {
      const preCallBrief = await this.generatePreCallBrief({
        bookingId,
        rateLimitKey: booking.mentee_id,
        buyerGoals: booking.match_reason || '',
        buyerBackground: booking.intake_background || '',
        expertExpertise: booking.mentors.expertise.join(', '),
        expertName: booking.mentors.full_name,
      });

      await supabaseAdmin
        .from('bookings')
        .update({ briefing_json: preCallBrief as unknown as Json })
        .eq('id', bookingId);

      await this.logAudit('PRE_CALL_BRIEF_GENERATED', bookingId, { preCallBrief });
      return preCallBrief;
    }

    throw new Error(`Unsupported service_type for briefing: ${service_type}`);
  }

  /**
   * Dual-audience pre-session briefing: mentee (second person) + expert (third person).
   */
  private async generateDualSessionBriefing(input: {
    bookingId: string;
    rateLimitKey: string;
    buyerName: string;
    buyerGoals: string;
    buyerBackground: string;
    expertName: string;
    expertExpertise: string;
  }): Promise<SessionBriefingBundle> {
    const prompt = `
      Buyer name: ${input.buyerName}
      Buyer goals & questions: ${input.buyerGoals}
      Buyer background: ${input.buyerBackground || '(not provided)'}
      Expert: ${input.expertName}
      Expert expertise: ${input.expertExpertise}
    `;

    const raw = await callLlmWithBackoff(() =>
      generateStructuredJson<SessionBriefingBundle>({
        model: llmProModel,
        rateLimitKey: input.rateLimitKey,
        systemInstruction: DUAL_SESSION_BRIEFING_SYSTEM_INSTRUCTION,
        prompt,
        schema: DUAL_SESSION_BRIEFING_SCHEMA,
        audit: {
          agentId: this.agentId,
          operation: 'dual_session_briefing',
          refId: input.bookingId,
        },
      }),
    );

    return { ...raw, version: 2 };
  }

  /**
   * Async pre-call brief: structures buyer context and questions before the expert session.
   */
  private async generatePreCallBrief(input: {
    bookingId: string;
    rateLimitKey: string;
    buyerGoals: string;
    buyerBackground: string;
    expertExpertise: string;
    expertName: string;
  }): Promise<PreCallBriefOutput> {
    const systemInstruction = `
      You are AstroLink's pre-call brief engine for paid expert sessions in aerospace and space.
      Given the buyer's goals and background, produce a concise brief they can use to maximize time with the expert.
      Do NOT compare resumes to job descriptions, score hiring fit, or act as a recruiting tool.
      Return valid JSON only.
    `;

    const prompt = `
      Buyer goals: ${input.buyerGoals}
      Buyer background: ${input.buyerBackground}
      Expert: ${input.expertName}
      Expert expertise: ${input.expertExpertise}
    `;

    return callLlmWithBackoff(() =>
      generateStructuredJson<PreCallBriefOutput>({
        model: llmProModel,
        rateLimitKey: input.rateLimitKey,
        systemInstruction,
        prompt,
        audit: {
          agentId: this.agentId,
          operation: 'pre_call_brief',
          refId: input.bookingId,
        },
        schema: {
          type: 'OBJECT',
          properties: {
            buyer_context_summary: { type: 'STRING' },
            buyer_strengths: {
              type: 'ARRAY',
              items: { type: 'STRING' },
            },
            focus_areas: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  topic: { type: 'STRING' },
                  why_for_expert: { type: 'STRING' },
                  severity: { type: 'STRING', enum: ['high', 'medium'] },
                  suggested_angle: { type: 'STRING' },
                },
                required: ['topic', 'why_for_expert', 'severity', 'suggested_angle'],
              },
            },
            proposed_questions: {
              type: 'ARRAY',
              items: { type: 'STRING' },
            },
            session_readiness_score: { type: 'NUMBER' },
            one_line_summary: { type: 'STRING' },
          },
          required: [
            'buyer_context_summary',
            'buyer_strengths',
            'focus_areas',
            'proposed_questions',
            'session_readiness_score',
            'one_line_summary',
          ],
        },
      }),
    );
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