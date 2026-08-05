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

export type SubmitExpertReviewResult = {
  reviewId: string;
  status: 'pending' | 'approved';
  autoPublished: boolean;
  moderationVerdict: 'clear' | 'flagged' | 'error';
};

export type ReviewModerationVerdict = 'clear' | 'flagged' | 'error';

export type ReviewModerationResult = {
  verdict: ReviewModerationVerdict;
  reason: string;
  quote_safe: boolean;
  display_name_safe: boolean;
  recommended_display_name: string;
  policy_flags: string[];
};

/** Hard public-safety flags — anything else (tone, criticism) stays clear. */
const HARD_POLICY_FLAGS = new Set([
  'pii',
  'harassment',
  'hate',
  'hate_speech',
  'contact_info',
  'contact',
  'doxxing',
  'abuse',
  'threat',
  'sexual',
  'illegal',
]);

export function isAutoPublishEligible(
  moderation: ReviewModerationResult,
  consentToPublish: boolean,
): boolean {
  if (!consentToPublish) return false;
  if (moderation.verdict !== 'clear') return false;
  if (moderation.quote_safe !== true || moderation.display_name_safe !== true) return false;
  const flags = Array.isArray(moderation.policy_flags) ? moderation.policy_flags : [];
  for (const flag of flags) {
    const normalized = String(flag).trim().toLowerCase().replace(/\s+/g, '_');
    if (HARD_POLICY_FLAGS.has(normalized)) return false;
  }
  return true;
}

function normalizeModeration(raw: {
  verdict?: unknown;
  reason?: unknown;
  quote_safe?: unknown;
  display_name_safe?: unknown;
  recommended_display_name?: unknown;
  policy_flags?: unknown;
}): ReviewModerationResult {
  const quoteSafe = raw.quote_safe === true;
  const displayNameSafe = raw.display_name_safe === true;
  const flags = Array.isArray(raw.policy_flags)
    ? raw.policy_flags.filter((f): f is string => typeof f === 'string')
    : [];
  const hasHardFlag = flags.some((f) =>
    HARD_POLICY_FLAGS.has(String(f).trim().toLowerCase().replace(/\s+/g, '_')),
  );

  let verdict: ReviewModerationVerdict = 'flagged';
  if (raw.verdict === 'clear' || raw.verdict === 'flagged' || raw.verdict === 'error') {
    verdict = raw.verdict;
  } else if (quoteSafe && displayNameSafe && !hasHardFlag) {
    verdict = 'clear';
  }

  // Safety: never treat as clear if quote/name unsafe or hard flags present.
  if (verdict === 'clear' && (!quoteSafe || !displayNameSafe || hasHardFlag)) {
    verdict = 'flagged';
  }

  return {
    verdict,
    reason:
      typeof raw.reason === 'string' && raw.reason.trim()
        ? raw.reason.trim()
        : verdict === 'clear'
          ? 'Safe for public display.'
          : 'Needs human review before public display.',
    quote_safe: quoteSafe,
    display_name_safe: displayNameSafe,
    recommended_display_name:
      typeof raw.recommended_display_name === 'string' && raw.recommended_display_name.trim()
        ? raw.recommended_display_name.trim()
        : 'Verified Astro-Link user',
    policy_flags: flags,
  };
}

export class ReviewAgent {
  private agentId = 'APX-09' as const;

  async submitReview(input: SubmitExpertReviewInput): Promise<SubmitExpertReviewResult> {
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

    // Screen only — never block store on LLM soft denials.
    const moderation = await this.screenReview({
      quote,
      displayName,
      reviewerUserId: input.reviewerUserId,
    });

    const now = new Date().toISOString();
    const autoPublish = isAutoPublishEligible(moderation, input.consentToPublish);
    const status: 'pending' | 'approved' = autoPublish ? 'approved' : 'pending';

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
        status,
        source: input.source ?? 'post_session_survey',
        locale: input.locale ?? null,
        moderation_verdict: moderation.verdict,
        moderation_reason: moderation.reason,
        moderation_flags: moderation.policy_flags,
        moderation_json: moderation as unknown as Json,
        moderated_at: now,
        auto_published: autoPublish,
        approved_at: autoPublish ? now : null,
        approved_by: autoPublish ? 'APX-09' : null,
      })
      .select('id')
      .single();

    if (insertError || !inserted) {
      const msg = insertError?.message ?? 'unknown error';
      if (/duplicate key|unique constraint|expert_reviews_booking_id/i.test(msg)) {
        throw new Error('A review already exists for this booking.');
      }
      throw new Error(`Review creation failed: ${msg}`);
    }

    await this.logAudit('EXPERT_REVIEW_SUBMITTED', booking.id, {
      reviewId: inserted.id,
      expertId: booking.mentor_id,
      reviewerUserId: input.reviewerUserId,
      status,
      autoPublished: autoPublish,
      moderation,
    });

    if (autoPublish) {
      await this.logAudit('EXPERT_REVIEW_AUTO_APPROVED', inserted.id, {
        expertId: booking.mentor_id,
        approvedAt: now,
      });
      revalidateExpertReviews(booking.mentor_id);
    }

    return {
      reviewId: inserted.id,
      status,
      autoPublished: autoPublish,
      moderationVerdict: moderation.verdict,
    };
  }

  async approveReview(reviewId: string, approvedBy: string): Promise<void> {
    if (!reviewId?.trim()) {
      throw new Error('reviewId is required');
    }
    const now = new Date().toISOString();

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
        auto_published: false,
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

  /**
   * Public-safety screen only. Fail-open on LLM errors (verdict=error, still store).
   * Critical/negative feedback without policy issues should return clear.
   */
  private async screenReview(input: {
    quote: string;
    displayName: string;
    reviewerUserId: string;
  }): Promise<ReviewModerationResult> {
    try {
      const raw = await callLlmWithBackoff(() =>
        generateStructuredJson<{
          verdict: string;
          reason: string;
          quote_safe: boolean;
          display_name_safe: boolean;
          recommended_display_name: string;
          policy_flags: string[];
        }>({
          model: llmFlashModel,
          rateLimitKey: input.reviewerUserId,
          systemInstruction: `You are APX-09, AstroLink's public-safety screener for expert session reviews.

You do NOT block storage. You classify whether the quote and display name are safe for the PUBLIC expert profile.

Return JSON only with:
- verdict: "clear" | "flagged" (never invent other values)
- reason: short explanation for admins
- quote_safe: boolean
- display_name_safe: boolean
- recommended_display_name: string (safe alternative if display name is too specific)
- policy_flags: string[] (use: pii, harassment, hate, contact_info, doxxing, abuse — empty if none)

Rules:
- Critical, negative, or low-star feedback is OK for public if it is not abusive. Prefer verdict=clear for constructive criticism.
- Flag PII, contact details, schools/employers as identifiers, hate, harassment, threats, or doxxing.
- Do not invent or rewrite the quote. Do not sanitize silently.
- If the quote is safe but the display name is too identifying, set display_name_safe=false, verdict=flagged, and suggest recommended_display_name.
`,
          prompt: `Screen this review for public expert-profile display.

Quote:
${input.quote}

Display name:
${input.displayName}
`,
          audit: {
            agentId: 'APX-09',
            operation: 'expert_review_moderation',
            refId: input.reviewerUserId,
          },
          schema: {
            type: 'OBJECT',
            properties: {
              verdict: { type: 'STRING' },
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
              'verdict',
              'reason',
              'quote_safe',
              'display_name_safe',
              'recommended_display_name',
              'policy_flags',
            ],
          },
        }),
      );

      return normalizeModeration(raw);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Moderation unavailable';
      return {
        verdict: 'error',
        reason: `Screening failed: ${message}. Held for human review.`,
        quote_safe: false,
        display_name_safe: false,
        recommended_display_name: 'Verified Astro-Link user',
        policy_flags: ['moderation_error'],
      };
    }
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
