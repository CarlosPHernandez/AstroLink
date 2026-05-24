import { ai, callGeminiWithBackoff } from '@/lib/gemini';
import { supabaseAdmin } from '@/lib/supabase';
import { GapAnalysisOutput, MentorBriefingOutput } from '@/lib/types';

export class BriefingAgent {
  private agentId = 'APX-02';

  /**
   * Prepares briefings or gap analysis depending on the booking's service type.
   */
  async prepareBriefing(bookingId: string) {
    await this.logAudit('BRIEFING_START', bookingId, {});

    // Fetch booking details including mentee and mentor details
    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .select('*, users(*), mentors(*)')
      .eq('id', bookingId)
      .single();

    if (bookingErr || !booking) {
      throw new Error(`Failed to load booking: ${bookingErr?.message}`);
    }

    const { service_type } = booking;

    if (service_type === 'session_1on1' || service_type === 'mock_interview') {
      const briefing = await this.generateSessionBriefing({
        menteeName: booking.users.full_name,
        menteeGoals: booking.match_reason || '',
        mentorName: booking.mentors.full_name,
        mentorExpertise: booking.mentors.expertise.join(', '),
      });

      // TODO: Save briefing results to a custom table or JSON column on bookings
      await this.logAudit('BRIEFING_GENERATED', bookingId, { briefing });
      return briefing;
    } else if (service_type === 'resume_review') {
      // In a real flow, you would pull the mentee's resume plaintext from bucket/db
      const resumeText = 'Plaintext parsed resume content...';
      const targetJobDesc = 'Target aerospace systems engineering job description...';

      const gapAnalysis = await this.generateResumeGapAnalysis({
        resumeText,
        jobDescription: targetJobDesc,
        mentorExpertise: booking.mentors.expertise.join(', '),
      });

      await this.logAudit('GAP_ANALYSIS_GENERATED', bookingId, { gapAnalysis });
      return gapAnalysis;
    }
  }

  /**
   * Workflow A: Generate Pre-Session Briefing Packet (using Gemini Pro / Flash fallback)
   */
  private async generateSessionBriefing(input: {
    menteeName: string;
    menteeGoals: string;
    mentorName: string;
    mentorExpertise: string;
  }): Promise<MentorBriefingOutput> {
    const systemInstruction = `
      You are AstraLink's session preparation engine. Your objective is to formulate a structured pre-session briefing for an aerospace mentor.
      Analyze the mentee’s career objectives and prepare a highly actionable, high-density agenda.
      Return valid JSON only.
    `;

    const prompt = `
      Mentee: ${input.menteeName}
      Mentee Goals: ${input.menteeGoals}
      Mentor: ${input.mentorName}
      Mentor Expertise: ${input.mentorExpertise}
    `;

    const runCall = async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
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
            required: ['session_objectives', 'recommended_agenda', 'mentee_context_summary', 'suggested_resources'],
          },
        },
      });

      return JSON.parse(response.text || '{}') as MentorBriefingOutput;
    };

    return callGeminiWithBackoff(runCall);
  }

  /**
   * Workflow B: Technical Resume Gap Analysis
   */
  private async generateResumeGapAnalysis(input: {
    resumeText: string;
    jobDescription: string;
    mentorExpertise: string;
  }): Promise<GapAnalysisOutput> {
    const systemInstruction = `
      You are AstraLink's Aerospace Technical Recruiting Engine. Review the candidate's plaintext resume against the target job description.
      Identify exactly three technical or credential gaps.
      Be brutally honest, constructive, and highly technical. Return valid JSON only.
    `;

    const prompt = `
      Candidate Resume: ${input.resumeText}
      Target Job Description: ${input.jobDescription}
      Mentor Expertise: ${input.mentorExpertise}
    `;

    const runCall = async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              candidate_strengths: {
                type: 'ARRAY',
                items: { type: 'STRING' },
              },
              critical_gaps: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    gap: { type: 'STRING' },
                    jd_requirement: { type: 'STRING' },
                    severity: { type: 'STRING', enum: ['high', 'medium'] },
                    suggested_fix: { type: 'STRING' },
                  },
                  required: ['gap', 'jd_requirement', 'severity', 'suggested_fix'],
                },
              },
              overall_fit_score: { type: 'NUMBER' },
              one_line_summary: { type: 'STRING' },
            },
            required: ['candidate_strengths', 'critical_gaps', 'overall_fit_score', 'one_line_summary'],
          },
        },
      });

      return JSON.parse(response.text || '{}') as GapAnalysisOutput;
    };

    return callGeminiWithBackoff(runCall);
  }

  private async logAudit(event: string, refId: string | null, payload: object) {
    await supabaseAdmin.from('audit_log').insert({
      agent_id: this.agentId,
      event,
      ref_id: refId,
      payload,
    });
  }
}
