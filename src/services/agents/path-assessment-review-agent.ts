import 'server-only';

import {
  createDevSkippedPaymentIntentId,
  isStripePaymentsSkipped,
} from '@/lib/booking-payments';
import {
  buildWrittenReviewDeliveredBuyerEmail,
  buildWrittenReviewNewMentorEmail,
  buildWrittenReviewPaidBuyerEmail,
} from '@/lib/email/path-assessment-review-templates';
import { sendEmail } from '@/lib/email/resend-client';
import { generatePathAssessmentPublicToken } from '@/lib/path-assessment/tokens';
import {
  WRITTEN_REPORT_REVIEW_CENTS,
  WRITTEN_REPORT_REVIEW_PRODUCT,
  WRITTEN_REPORT_REVIEW_SLA_DAYS,
} from '@/lib/path-assessment/written-review-pricing';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';

type MentorOfferRow = {
  id: string;
  full_name: string;
  email: string;
  slug: string | null;
  compliance_status: string;
  is_listed: boolean;
  written_report_reviews_enabled: boolean;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class PathAssessmentReviewAgent {
  private agentId = 'APX-11' as const;

  async createGuestReview(params: {
    assessmentToken: string;
    mentorSlug: string;
    buyerEmail?: string | null;
    buyerName?: string | null;
  }): Promise<{
    reviewId: string;
    publicToken: string;
    clientSecret: string | null;
    amountCents: number;
    paymentIntentId: string;
    skipStripe: boolean;
  }> {
    const assessmentToken = params.assessmentToken.trim();
    if (!/^[a-f0-9]{64}$/i.test(assessmentToken)) {
      throw new Error('Invalid assessment.');
    }

    const { data: assessment, error: aErr } = await supabaseAdmin
      .from('path_assessments')
      .select('id, email, first_name, status, public_token')
      .eq('public_token', assessmentToken)
      .maybeSingle();

    if (aErr || !assessment) {
      throw new Error('Assessment not found.');
    }
    if (assessment.status !== 'ready') {
      throw new Error('Assessment report is not ready yet.');
    }

    const { data: mentor, error: mErr } = await supabaseAdmin
      .from('mentors')
      .select(
        'id, full_name, email, slug, compliance_status, is_listed, written_report_reviews_enabled',
      )
      .eq('slug', params.mentorSlug)
      .maybeSingle();

    if (mErr || !mentor) {
      throw new Error('Expert not found.');
    }
    const m = mentor as MentorOfferRow;
    if (m.compliance_status !== 'approved' || !m.is_listed) {
      throw new Error('This expert is not available.');
    }
    if (!m.written_report_reviews_enabled) {
      throw new Error('Written report reviews are not available for this expert.');
    }

    const email = normalizeEmail(params.buyerEmail?.trim() || assessment.email);
    if (!email.includes('@') || email.length < 5) {
      throw new Error('A valid email is required.');
    }
    const buyerName =
      params.buyerName?.trim() ||
      assessment.first_name?.trim() ||
      email.split('@')[0] ||
      'Guest';

    const amountCents = WRITTEN_REPORT_REVIEW_CENTS;
    const skipStripe = isStripePaymentsSkipped();
    let paymentIntentId: string;
    let clientSecret: string | null = null;

    if (skipStripe) {
      paymentIntentId = createDevSkippedPaymentIntentId();
    } else {
      const pi = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        receipt_email: email,
        automatic_payment_methods: { enabled: true },
        metadata: {
          app: 'astrolink',
          product: WRITTEN_REPORT_REVIEW_PRODUCT,
          mentor_id: m.id,
          buyer_email: email,
          path_assessment_id: assessment.id,
        },
      });
      paymentIntentId = pi.id;
      clientSecret = pi.client_secret;
    }

    const publicToken = generatePathAssessmentPublicToken();

    const { data: created, error: insertErr } = await supabaseAdmin
      .from('path_assessment_reviews')
      .insert({
        path_assessment_id: assessment.id,
        mentor_id: m.id,
        buyer_email: email,
        buyer_name: buyerName.slice(0, 120),
        public_token: publicToken,
        status: 'pending_payment',
        amount_cents: amountCents,
        stripe_payment_intent_id: paymentIntentId,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertErr || !created) {
      throw new Error(insertErr?.message ?? 'Could not create review order.');
    }

    if (!skipStripe) {
      try {
        await stripe.paymentIntents.update(paymentIntentId, {
          metadata: {
            app: 'astrolink',
            product: WRITTEN_REPORT_REVIEW_PRODUCT,
            mentor_id: m.id,
            buyer_email: email,
            path_assessment_id: assessment.id,
            path_assessment_review_id: created.id as string,
          },
        });
      } catch (err) {
        console.warn('[path-assessment-review] failed to update PI metadata', err);
      }
    }

    if (skipStripe) {
      await this.markPaid({
        paymentIntentId,
        reviewId: created.id as string,
      });
    }

    await this.logAudit('REVIEW_ORDER_CREATED', created.id as string, {
      mentorId: m.id,
      assessmentId: assessment.id,
      skipStripe,
    });

    return {
      reviewId: created.id as string,
      publicToken,
      clientSecret,
      amountCents,
      paymentIntentId,
      skipStripe,
    };
  }

  async markPaid(params: {
    paymentIntentId: string;
    reviewId?: string;
  }): Promise<void> {
    let query = supabaseAdmin.from('path_assessment_reviews').select('*');
    if (params.reviewId) {
      query = query.eq('id', params.reviewId);
    } else {
      query = query.eq('stripe_payment_intent_id', params.paymentIntentId);
    }

    const { data: row, error } = await query.maybeSingle();
    if (error || !row) {
      console.error('[path-assessment-review] markPaid missing row', error?.message);
      return;
    }
    if (row.status !== 'pending_payment') {
      return;
    }

    const dueAt = new Date();
    dueAt.setUTCDate(dueAt.getUTCDate() + WRITTEN_REPORT_REVIEW_SLA_DAYS);

    const { error: upErr } = await supabaseAdmin
      .from('path_assessment_reviews')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        due_at: dueAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);

    if (upErr) {
      console.error('[path-assessment-review] markPaid update failed', upErr.message);
      return;
    }

    const { data: mentor } = await supabaseAdmin
      .from('mentors')
      .select('full_name, email')
      .eq('id', row.mentor_id)
      .maybeSingle();

    const buyerEmail = buildWrittenReviewPaidBuyerEmail({
      buyerName: row.buyer_name,
      mentorName: mentor?.full_name ?? 'your expert',
      slaDays: WRITTEN_REPORT_REVIEW_SLA_DAYS,
    });
    await sendEmail({
      to: row.buyer_email,
      subject: buyerEmail.subject,
      html: buyerEmail.html,
    });

    if (mentor?.email) {
      const dueLabel = dueAt.toISOString().slice(0, 10);
      const mentorEmail = buildWrittenReviewNewMentorEmail({
        mentorName: mentor.full_name,
        buyerName: row.buyer_name || row.buyer_email,
        dueAtLabel: dueLabel,
        dashboardHint: 'Open your mentor dashboard → Report reviews to respond.',
      });
      await sendEmail({
        to: mentor.email,
        subject: mentorEmail.subject,
        html: mentorEmail.html,
      });
    }

    await this.logAudit('REVIEW_PAID', row.id, { paymentIntentId: params.paymentIntentId });
  }

  async deliver(params: {
    reviewId: string;
    mentorUserId: string;
    writtenResponse: string;
  }): Promise<void> {
    const response = params.writtenResponse.trim();
    if (response.length < 40 || response.length > 12000) {
      throw new Error('Written response must be between 40 and 12,000 characters.');
    }

    const { data: mentor } = await supabaseAdmin
      .from('mentors')
      .select('id, full_name')
      .eq('user_id', params.mentorUserId)
      .maybeSingle();

    if (!mentor) {
      throw new Error('Mentor profile not found.');
    }

    const { data: row, error } = await supabaseAdmin
      .from('path_assessment_reviews')
      .select('*')
      .eq('id', params.reviewId)
      .eq('mentor_id', mentor.id)
      .maybeSingle();

    if (error || !row) {
      throw new Error('Review not found.');
    }
    if (row.status !== 'paid' && row.status !== 'in_progress') {
      throw new Error('This review cannot be delivered in its current state.');
    }

    const { data: assessment } = await supabaseAdmin
      .from('path_assessments')
      .select('public_token')
      .eq('id', row.path_assessment_id)
      .maybeSingle();

    const { error: upErr } = await supabaseAdmin
      .from('path_assessment_reviews')
      .update({
        status: 'delivered',
        written_response: response,
        delivered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);

    if (upErr) {
      throw new Error(upErr.message);
    }

    const assessmentToken = assessment?.public_token ?? '';

    const delivered = buildWrittenReviewDeliveredBuyerEmail({
      buyerName: row.buyer_name,
      mentorName: mentor.full_name,
      reviewToken: row.public_token,
      assessmentToken,
      writtenResponse: response,
    });
    await sendEmail({
      to: row.buyer_email,
      subject: delivered.subject,
      html: delivered.html,
    });

    await this.logAudit('REVIEW_DELIVERED', row.id, {});
  }

  private async logAudit(event: string, refId: string, payload: Record<string, unknown>) {
    try {
      await supabaseAdmin.from('audit_log').insert({
        agent_id: this.agentId,
        event,
        ref_id: refId,
        payload: payload as never,
      });
    } catch {
      // best-effort audit
    }
  }
}
