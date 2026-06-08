import type { Json } from '@/lib/database.types';
import { callLlmWithBackoff, generateStructuredJson, llmFlashModel } from '@/lib/llm';
import { supabaseAdmin } from '@/lib/supabase';
import { buildTranslationSystemPrompt } from '@/lib/transcript-translation/glossary';
import {
  TRANSLATION_AGENT_ID,
  shouldSkipTranslation,
  type SupportedTargetLocale,
} from '@/lib/transcript-translation/types';
import { parsePostSessionOutput } from '@/lib/transcript-translation/recap-locale';
import type { PostSessionOutput } from '@/lib/types';

function isE2eStubLlmEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.E2E_STUB_LLM === 'true';
}

function localizeRecapStub(english: PostSessionOutput, targetLocale: SupportedTargetLocale): PostSessionOutput {
  const tag = `[${targetLocale}]`;
  return {
    session_summary: `${tag} ${english.session_summary}`,
    key_insights: english.key_insights.map((insight) => `${tag} ${insight}`),
    action_items: english.action_items.map((item) => ({
      ...item,
      task: `${tag} ${item.task}`,
    })),
    mentor_feedback_prompt: `${tag} ${english.mentor_feedback_prompt}`,
    recommended_next_session: `${tag} ${english.recommended_next_session}`,
  };
}

const POST_SESSION_SCHEMA = {
  type: 'OBJECT' as const,
  properties: {
    session_summary: { type: 'STRING' as const },
    key_insights: {
      type: 'ARRAY' as const,
      items: { type: 'STRING' as const },
    },
    action_items: {
      type: 'ARRAY' as const,
      items: {
        type: 'OBJECT' as const,
        properties: {
          task: { type: 'STRING' as const },
          owner: { type: 'STRING' as const, enum: ['mentor', 'mentee'] },
          deadline: { type: 'STRING' as const },
        },
        required: ['task', 'owner', 'deadline'],
      },
    },
    mentor_feedback_prompt: { type: 'STRING' as const },
    recommended_next_session: { type: 'STRING' as const },
  },
  required: [
    'session_summary',
    'key_insights',
    'action_items',
    'mentor_feedback_prompt',
    'recommended_next_session',
  ],
};

export class TranslationAgent {
  private agentId = TRANSLATION_AGENT_ID;

  /**
   * Translates English sessions.summary_json into session_translations for target locale.
   * Idempotent per (booking_id, target_locale).
   */
  async translateSessionRecap(
    bookingId: string,
    targetLocale: SupportedTargetLocale,
  ): Promise<PostSessionOutput | null> {
    if (shouldSkipTranslation('en', targetLocale)) {
      await this.logAudit('RECAP_TRANSLATION_SKIPPED', bookingId, {
        targetLocale,
        reason: 'same_language',
      });
      return null;
    }

    const { data: existingTranslation } = await supabaseAdmin
      .from('session_translations')
      .select('summary_json')
      .eq('booking_id', bookingId)
      .eq('target_locale', targetLocale)
      .maybeSingle();

    if (existingTranslation?.summary_json) {
      const parsed = parsePostSessionOutput(existingTranslation.summary_json);
      if (parsed) {
        await this.logAudit('RECAP_TRANSLATION_SKIPPED', bookingId, {
          targetLocale,
          reason: 'already_translated',
        });
        return parsed;
      }
    }

    const { data: sessionRow, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('summary_json')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (sessionError) {
      throw new Error(`sessions lookup failed: ${sessionError.message}`);
    }

    const englishRecap = parsePostSessionOutput(sessionRow?.summary_json ?? null);
    if (!englishRecap) {
      await this.logAudit('RECAP_TRANSLATION_SKIPPED', bookingId, {
        targetLocale,
        reason: 'english_summary_missing',
      });
      return null;
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('mentee_id')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error(`booking lookup failed: ${bookingError?.message ?? 'not found'}`);
    }

    let translated: PostSessionOutput;

    if (isE2eStubLlmEnabled()) {
      translated = localizeRecapStub(englishRecap, targetLocale);
    } else {
      const systemInstruction = buildTranslationSystemPrompt({
        sourceLocale: 'en',
        targetLocale,
      });

      const prompt = `Translate this post-session recap JSON from English to ${targetLocale}. Preserve structure and owner enum values. Return valid JSON only.\n\n${JSON.stringify(englishRecap)}`;

      translated = await callLlmWithBackoff(() =>
        generateStructuredJson<PostSessionOutput>({
          model: llmFlashModel,
          rateLimitKey: booking.mentee_id,
          systemInstruction,
          prompt,
          schema: POST_SESSION_SCHEMA,
        }),
      );
    }

    const { error: upsertError } = await supabaseAdmin.from('session_translations').upsert(
      {
        booking_id: bookingId,
        target_locale: targetLocale,
        summary_json: translated as unknown as Json,
        translated_at: new Date().toISOString(),
      },
      { onConflict: 'booking_id,target_locale' },
    );

    if (upsertError) {
      throw new Error(`session_translations upsert failed: ${upsertError.message}`);
    }

    await this.logAudit('RECAP_TRANSLATED', bookingId, {
      targetLocale,
      stub: isE2eStubLlmEnabled(),
    });

    return translated;
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
