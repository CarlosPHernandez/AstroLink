import type { Json } from '@/lib/database.types';
import { callLlmWithBackoff, generateStructuredJson, llmFlashModel } from '@/lib/llm';
import { supabaseAdmin } from '@/lib/supabase';
import { revalidateExpertReviews } from '@/lib/expert-reviews';
import type {
  ExpertReviewAttributionType,
  ExpertReviewSource,
} from '@/lib/expert-reviews/types';

export type SubmitExpertReviewInput = {
  bookingId: string;
  reviewerUserId: string;
  rating: number;
  quote: string;
  displayName: string;
  attributionType: ExpertReviewAttributionType;
  consentToPublish: boolean;
  locale?: string | null;
  source?: ExpertReviewSource;
  consentNotes?: string | null;
};

export class ReviewAgent {
  private agentId = 'APX-09' as const;

  async submitReview(input: SubmitExpertReviewInput): Promise<string> {
    const bookingId = input.bookingId?.trim();
    const quote = input.quote?.trim();
    const displayName = input.displayName?.trim();

    if (!bookingId) {
      throw new Error('bookingId is required');
    }
    if (!quote || quote.length < 20 || quote.length > 600) {
      throw new Error('Quote must be between 20 and 600 characters.');
    }
    // Match DB CHECK: char_length(trim(display_name)) >= 2 AND <= 80
    if (!displayName || displayName.length < 2 || displayName.length > 80) {
      throw new Error('displayName must be between 2 and 80 characters.');
    }
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      throw new Error('rating must be an integer between 1 and 5');
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, mentor_id, mentee_id, status')
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      throw new Error(`Booking lookup failed: ${bookingError.message}`);
    }
    if (!booking) {
      throw new Error('Booking not found');
    }
    if (booking.mentee_id !== input.reviewerUserId) {
      throw new Error('Forbidden');
    }
    if (booking.status !== 'completed') {
      throw new Error('Review may only be submitted for completed sessions.');
    }

    const { data: existingReviews, error: existingReviewError } = await supabaseAdmin
      .from('expert_reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .limit(1);

    if (existingReviewError) {
      throw new Error(`Review lookup failed: ${existingReviewError.message}`);
    }
    if (Array.isArray(existingReviews) && existingReviews.length > 0) {
      throw new Error('A review already exists for this booking.');
    }

    const moderation = await this.moderateReview({
      quote,
      displayName,
      reviewerUserId: input.reviewerUserId,
      consentToPublish: input.consentToPublish,
    });

    // Strict equality: LLM/JSON may coerce or return non-booleans; only explicit true allows store.
    if (moderation.allowed !== true) {
      const reason =
        typeof moderation.reason === 'string' && moderation.reason.trim()
          ? moderation.reason.trim()
          : 'Content did not pass safety checks.';
      throw new Error(`Review failed moderation: ${reason}`);
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('expert_reviews')
      .insert({
        expert_id: booking.mentor_id,
        booking_id: booking.id,
        reviewer_user_id: input.reviewerUserId,
        rating: input.rating,
        quote,
        display_name: displayName,
        attribution_type: input.attributionType,
        consent_to_publish: input.consentToPublish,
        consent_notes: input.consentNotes ?? null,
        status: 'pending',
        source: input.source ?? 'post_session_survey',
        locale: input.locale ?? null,
      })
      .select('id')
      .single();

    if (insertError || !inserted) {
      const msg = insertError?.message ?? 'unknown error';
      // Unique index expert_reviews_booking_id_uidx — concurrent double-submit race.
      if (/duplicate key|unique constraint|expert_reviews_booking_id/i.test(msg)) {
        throw new Error('A review already exists for this booking.');
      }
      throw new Error(`Review creation failed: ${msg}`);
    }

    await this.logAudit('EXPERT_REVIEW_SUBMITTED', booking.id, {
      reviewId: inserted.id,
      expertId: booking.mentor_id,
      reviewerUserId: input.reviewerUserId,
      status: 'pending',
      moderation,
    });

    return inserted.id;
  }

  async approveReview(reviewId: string, approvedBy: string): Promise<void> {
    if (!reviewId?.trim()) {
      throw new Error('reviewId is required');
    }
    const now = new Date().toISOString();

    // Do not force consent — only publish when the reviewer already consented.
    const { data: existing, error: lookupError } = await supabaseAdmin
      .from('expert_reviews')
      .select('id, expert_id, consent_to_publish, status')
      .eq('id', reviewId)
      .maybeSingle();

    if (lookupError) {
      throw new Error(`Review approval failed: ${lookupError.message}`);
    }
    if (!existing) {
      throw new Error('Review not found');
    }
    if (existing.consent_to_publish !== true) {
      throw new Error(
        'Cannot approve without consent to publish. Reviewer must consent before the quote can go public.',
      );
    }

    const { data, error } = await supabaseAdmin
      .from('expert_reviews')
      .update({
        status: 'approved',
        approved_at: now,
        approved_by: approvedBy,
      })
      .eq('id', reviewId)
      .eq('consent_to_publish', true)
      .select('id, expert_id')
      .maybeSingle();

    if (error) {
      throw new Error(`Review approval failed: ${error.message}`);
    }
    if (!data) {
      throw new Error('Review not found');
    }

    await this.logAudit('EXPERT_REVIEW_APPROVED', reviewId, {
      approvedBy,
      approvedAt: now,
    });
    revalidateExpertReviews(data.expert_id);
  }

  async hideReview(reviewId: string, approvedBy: string): Promise<void> {
    if (!reviewId?.trim()) {
      throw new Error('reviewId is required');
    }
    const { data, error } = await supabaseAdmin
      .from('expert_reviews')
      .update({
        status: 'hidden',
        consent_to_publish: false,
        approved_by: approvedBy,
      })
      .eq('id', reviewId)
      .select('id, expert_id')
      .maybeSingle();

    if (error) {
      throw new Error(`Review hide failed: ${error.message}`);
    }
    if (!data) {
      throw new Error('Review not found');
    }

    await this.logAudit('EXPERT_REVIEW_HIDDEN', reviewId, {
      approvedBy,
    });
    revalidateExpertReviews(data.expert_id);
  }

  async withdrawReview(reviewId: string, approvedBy: string): Promise<void> {
    if (!reviewId?.trim()) {
      throw new Error('reviewId is required');
    }
    const { data, error } = await supabaseAdmin
      .from('expert_reviews')
      .update({
        status: 'withdrawn',
        approved_by: approvedBy,
      })
      .eq('id', reviewId)
      .select('id, expert_id')
      .maybeSingle();

    if (error) {
      throw new Error(`Review withdraw failed: ${error.message}`);
    }
    if (!data) {
      throw new Error('Review not found');
    }

    await this.logAudit('EXPERT_REVIEW_WITHDRAWN', reviewId, {
      approvedBy,
    });
    revalidateExpertReviews(data.expert_id);
  }

  private async moderateReview(input: {
    quote: string;
    displayName: string;
    reviewerUserId: string;
    consentToPublish: boolean;
  }) {
    const systemInstruction = `You are the AstroLink review safety moderator (APX-09). Assess whether the review quote and display name are safe for public display on an expert profile page. Do not invent any new content.

Return JSON only with:
- allowed: boolean
- reason: string
- quote_safe: boolean
- display_name_safe: boolean
- recommended_display_name: string
- policy_flags: string[]
`;

    const prompt = `Review the expert feedback text and the display name.

Quote:
${input.quote}

Display name:
${input.displayName}

Guidelines:
- Flag PII, private data, personal identifiers, schools, employers, or contact details.
- Flag hate speech, harassment, or abusive language.
- Flag anything that would make the quote unsafe for publication.
- Prefer safe, anonymized attribution if the original display name is too specific.
- If the quote is safe but the display name is unsafe, suggest a generic alternative.

If the review is safe to store as pending but not yet safe to publish, set allowed=false and explain why. Do not sanitize silently.
`;

    return callLlmWithBackoff(() =>
      generateStructuredJson<{
        allowed: boolean;
        reason: string;
        quote_safe: boolean;
        display_name_safe: boolean;
        recommended_display_name: string;
        policy_flags: string[];
      }>({
        model: llmFlashModel,
        rateLimitKey: input.reviewerUserId,
        systemInstruction,
        prompt,
        audit: {
          agentId: 'APX-09',
          operation: 'expert_review_moderation',
          refId: input.reviewerUserId,
        },
        schema: {
          type: 'OBJECT',
          properties: {
            allowed: { type: 'BOOLEAN' },
            reason: { type: 'STRING' },
            quote_safe: { type: 'BOOLEAN' },
            display_name_safe: { type: 'BOOLEAN' },
            recommended_display_name: { type: 'STRING' },
            policy_flags: {
              type: 'ARRAY',
              items: { type: 'STRING' },
            },
          },
          required: [
            'allowed',
            'reason',
            'quote_safe',
            'display_name_safe',
            'recommended_display_name',
            'policy_flags',
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
