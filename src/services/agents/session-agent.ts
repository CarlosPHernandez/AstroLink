import type { Json } from '@/lib/database.types';
import { callLlmWithBackoff, generateStructuredJson, llmFlashModel } from '@/lib/llm';
import { parsePostSessionOutput } from '@/lib/transcript-translation/recap-locale';
import { supabaseAdmin } from '@/lib/supabase';
import { PostSessionOutput } from '@/lib/types';

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === '23505';
}

export class SessionAgent {
  private agentId = 'APX-03' as const;

  /**
   * Summarizes the concluded session using transcript text.
   * Idempotent on booking_id; upgrades fallback sessions when real transcript arrives.
   */
  async synthesizeSession(bookingId: string, transcript: string, durationMinutes: number) {
    await this.logAudit('SESSION_SYNTHESIS_START', bookingId, { durationMinutes });

    const { data: existingSession } = await supabaseAdmin
      .from('sessions')
      .select('id, transcript_available, summary_json')
      .eq('booking_id', bookingId)
      .maybeSingle();

    const hasTranscript = Boolean(transcript.trim());
    const existingSummary = parsePostSessionOutput(existingSession?.summary_json ?? null);

    if (existingSession) {
      if (existingSession.transcript_available && existingSummary) {
        await this.logAudit('SESSION_SYNTHESIS_SKIPPED', bookingId, {
          reason: 'already_synthesized',
        });
        return existingSummary;
      }
      if (!hasTranscript && existingSummary) {
        await this.logAudit('SESSION_SYNTHESIS_SKIPPED', bookingId, {
          reason: 'fallback_exists',
        });
        return existingSummary;
      }
    }

    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .select('*, users(*), mentors(*)')
      .eq('id', bookingId)
      .single();

    if (bookingErr || !booking) {
      throw new Error(`Failed to load booking details: ${bookingErr?.message}`);
    }

    const synthesis = await this.generateSynthesis({
      rateLimitKey: booking.mentee_id,
      serviceType: booking.service_type,
      transcript,
      sessionObjectives: [],
      durationMinutes,
    });

    if (existingSession) {
      const { error: updateErr } = await supabaseAdmin
        .from('sessions')
        .update({
          duration_seconds: durationMinutes * 60,
          transcript_available: hasTranscript,
          summary_json: synthesis as unknown as Json,
        })
        .eq('booking_id', bookingId);

      if (updateErr) {
        throw new Error(`Failed to upgrade session record: ${updateErr.message}`);
      }

      await this.logAudit('SESSION_SYNTHESIS_UPGRADED', bookingId, { synthesis });
      return synthesis;
    }

    const { error: sessionErr } = await supabaseAdmin.from('sessions').insert({
      booking_id: bookingId,
      duration_seconds: durationMinutes * 60,
      transcript_available: hasTranscript,
      summary_json: synthesis as unknown as Json,
    });

    if (sessionErr) {
      if (isUniqueViolation(sessionErr)) {
        await this.logAudit('SESSION_SYNTHESIS_SKIPPED', bookingId, {
          reason: 'concurrent_insert',
        });
        const { data: racedSession } = await supabaseAdmin
          .from('sessions')
          .select('summary_json')
          .eq('booking_id', bookingId)
          .maybeSingle();
        return (racedSession?.summary_json ?? synthesis) as unknown as PostSessionOutput;
      }
      throw new Error(`Failed to insert session record: ${sessionErr.message}`);
    }

    await this.logAudit('SESSION_SYNTHESIS_COMPLETED', bookingId, { synthesis });

    return synthesis;
  }

  /**
   * Generates post-session summary and action items (using Gemini 2.5 Flash).
   */
  private async generateSynthesis(input: {
    rateLimitKey: string;
    serviceType: string;
    transcript: string;
    sessionObjectives: string[];
    durationMinutes: number;
  }): Promise<PostSessionOutput> {
    const systemInstruction = `
      You are AstroLink's post-session synthesis engine. Process the transcription of a paid aerospace expert session and extract the most valuable, actionable takeaways for the buyer.
      The transcript may mix English and Spanish (or other languages) from a bilingual session — read all lines and synthesize in English.
      Distinguish technical advice from small talk. Draft realistic action items with concrete responsibilities.
      If the transcript is empty or unavailable, generate a friendly template apologizing for the lack of audio telemetry and outlining standard recovery steps based on the service type.
      Return valid JSON only. All recap fields must be in English.
    `;

    const prompt = `
      Service Type: ${input.serviceType}
      Session Duration: ${input.durationMinutes} minutes
      Session Objectives: ${JSON.stringify(input.sessionObjectives)}
      Transcript: ${input.transcript || 'EMPTY_OR_UNAVAILABLE'}
    `;

    return callLlmWithBackoff(() =>
      generateStructuredJson<PostSessionOutput>({
        model: llmFlashModel,
        rateLimitKey: input.rateLimitKey,
        systemInstruction,
        prompt,
        schema: {
          type: 'OBJECT',
          properties: {
            session_summary: { type: 'STRING' },
            key_insights: {
              type: 'ARRAY',
              items: { type: 'STRING' },
            },
            action_items: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  task: { type: 'STRING' },
                  owner: { type: 'STRING', enum: ['mentor', 'mentee'] },
                  deadline: { type: 'STRING' },
                },
                required: ['task', 'owner', 'deadline'],
              },
            },
            mentor_feedback_prompt: { type: 'STRING' },
            recommended_next_session: { type: 'STRING' },
          },
          required: [
            'session_summary',
            'key_insights',
            'action_items',
            'mentor_feedback_prompt',
            'recommended_next_session',
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
