import type { Json } from '@/lib/database.types';
import { callLlmWithBackoff, generateStructuredJson, llmProModel } from '@/lib/llm';
import { supabaseAdmin } from '@/lib/supabase';
import { MentorBriefingOutput, PreCallBriefOutput } from '@/lib/types';

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
      const briefing = await this.generateSessionBriefing({
        rateLimitKey: booking.mentee_id,
        buyerName: booking.users.full_name,
        buyerGoals: booking.match_reason || '',
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
        rateLimitKey: booking.mentee_id,
        buyerGoals: booking.match_reason || '',
        buyerBackground: '', // TODO: load from booking intake fields when persisted
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
   * Pre-session briefing for the expert before a live call.
   */
  private async generateSessionBriefing(input: {
    rateLimitKey: string;
    buyerName: string;
    buyerGoals: string;
    expertName: string;
    expertExpertise: string;
  }): Promise<MentorBriefingOutput> {
    const systemInstruction = `
      You are AstroLink's expert-session preparation engine (comparable to GLG/Minnect-style paid expert calls).
      Prepare a structured pre-session briefing so the aerospace expert can deliver a high-value live session.
      Focus on the buyer's questions, context, and agenda — not job applications, resume scoring, or employer shortlists.
      Return valid JSON only.
    `;

    const prompt = `
      Buyer: ${input.buyerName}
      Buyer goals & questions: ${input.buyerGoals}
      Expert: ${input.expertName}
      Expert expertise: ${input.expertExpertise}
    `;

    return callLlmWithBackoff(() =>
      generateStructuredJson<MentorBriefingOutput>({
        model: llmProModel,
        rateLimitKey: input.rateLimitKey,
        systemInstruction,
        prompt,
        schema: {
          type: 'OBJECT',
          properties: {
            session_objectives: {
              type: 'ARRAY',
              items: { type: 'STRING' },
            },
            recommended_agenda: {
              type: 'OBJECT',
              properties: {
                minutes_0_5: { type: 'STRING' },
                minutes_5_20: { type: 'STRING' },
                minutes_20_28: { type: 'STRING' },
                minutes_28_30: { type: 'STRING' },
              },
              required: ['minutes_0_5', 'minutes_5_20', 'minutes_20_28', 'minutes_28_30'],
            },
            mentee_context_summary: { type: 'STRING' },
            suggested_resources: {
              type: 'ARRAY',
              items: { type: 'STRING' },
            },
          },
          required: [
            'session_objectives',
            'recommended_agenda',
            'mentee_context_summary',
            'suggested_resources',
          ],
        },
      }),
    );
  }

  /**
   * Async pre-call brief: structures buyer context and questions before the expert session.
   */
  private async generatePreCallBrief(input: {
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
