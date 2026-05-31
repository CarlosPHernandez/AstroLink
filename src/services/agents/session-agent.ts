import type { Json } from '@/lib/database.types';
import { ai, callGeminiWithBackoff } from '@/lib/gemini';
import { supabaseAdmin } from '@/lib/supabase';
import { PostSessionOutput } from '@/lib/types';

export class SessionAgent {
  private agentId = 'APX-03' as const;

  /**
   * Summarizes the concluded session using transcript text.
   */
  async synthesizeSession(bookingId: string, transcript: string, durationMinutes: number) {
    await this.logAudit('SESSION_SYNTHESIS_START', bookingId, { durationMinutes });

    // Fetch booking details
    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .select('*, users(*), mentors(*)')
      .eq('id', bookingId)
      .single();

    if (bookingErr || !booking) {
      throw new Error(`Failed to load booking details: ${bookingErr?.message}`);
    }

    const synthesis = await this.generateSynthesis({
      serviceType: booking.service_type,
      transcript,
      sessionObjectives: [], // Retrieve objectives if stored previously
      durationMinutes,
    });

    // Write to public.sessions
    const { error: sessionErr } = await supabaseAdmin.from('sessions').insert({
      booking_id: bookingId,
      duration_seconds: durationMinutes * 60,
      transcript_available: !!transcript,
      summary_json: synthesis as unknown as Json,
    });

    if (sessionErr) {
      throw new Error(`Failed to insert session record: ${sessionErr.message}`);
    }

    await this.logAudit('SESSION_SYNTHESIS_COMPLETED', bookingId, { synthesis });

    return synthesis;
  }

  /**
   * Generates post-session summary and action items (using Gemini 2.5 Flash).
   */
  private async generateSynthesis(input: {
    serviceType: string;
    transcript: string;
    sessionObjectives: string[];
    durationMinutes: number;
  }): Promise<PostSessionOutput> {
    const systemInstruction = `
      You are AstroLink's post-session synthesis engine. Process the transcription of a paid aerospace expert session and extract the most valuable, actionable takeaways for the buyer.
      Distinguish technical advice from small talk. Draft realistic action items with concrete responsibilities.
      If the transcript is empty or unavailable, generate a friendly template apologizing for the lack of audio telemetry and outlining standard recovery steps based on the service type.
      Return valid JSON only.
    `;

    const prompt = `
      Service Type: ${input.serviceType}
      Session Duration: ${input.durationMinutes} minutes
      Session Objectives: ${JSON.stringify(input.sessionObjectives)}
      Transcript: ${input.transcript || 'EMPTY_OR_UNAVAILABLE'}
    `;

    const runCall = async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
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
        },
      });

      return JSON.parse(response.text || '{}') as PostSessionOutput;
    };

    return callGeminiWithBackoff(runCall);
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
