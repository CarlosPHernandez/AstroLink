import type Stripe from 'stripe';
import type { Json } from '@/lib/database.types';
import {
  CHRIS_DISCOUNT_NAME,
  CHRIS_SESSION_DURATION_MINUTES,
} from '@/lib/chris-campaign/chris-campaign-constants';
import {
  chrisPricingMode,
  resolveChrisChargeCents,
  resolveChrisOriginalPriceCents,
  resolveChrisPricingTier,
} from '@/lib/chris-campaign/chris-pricing';
import { clampSessionDurationMinutes } from '@/lib/session-duration';
import {
  ChrisCampaignSoldOutError,
  releaseChrisCampaignSlot,
  reserveChrisCampaignSlot,
} from '@/lib/chris-campaign/chris-campaign-slots';
import {
  BOOKING_LEAD_TIME_ERROR,
  isScheduledAtOnOrAfterEarliestBookable,
} from '@/lib/booking-lead-time';
import { computeBookingTotalCents } from '@/lib/booking-pricing';
import {
  createDevSkippedPaymentIntentId,
  createFreeSessionPaymentIntentId,
  isStripePaymentsSkipped,
} from '@/lib/booking-payments';
import { resolveBookingMatchFields } from '@/lib/booking-match-fields';
import { incrementOfferCounter } from '@/lib/expert-offers/counters';
import { isOfferPubliclyBookable } from '@/lib/expert-offers/public-access';
import type { OfferSnapshot } from '@/lib/expert-offers/types';
import {
  ExpertMatchFailedError,
  matchListedMentor,
} from '@/lib/expert-match';
import { ExpertOfferBookingError, loadMentorWindows } from '@/lib/expert-offer/load-windows';
import * as offerSchema from '@/lib/expert-offer/schema';
import { confirmBookingWithoutPayment } from '@/lib/post-payment';
import {
  assertChrisWindowFree,
  getInviteForBooking,
  redeemGuestInviteForBooking,
} from '@/lib/guest-session-invites';
import { GUEST_INVITE_DURATION_MINUTES } from '@/lib/guest-invite-constants';
import {
  assertGrantApplicable,
  getGrantForApply,
  redeemGrantForBooking,
} from '@/lib/session-comp-grants';
import { getOrCreateStripeCustomerForMentee } from '@/lib/stripe-customer';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { MatchingOutput, ServiceType } from '@/lib/types';

type BookSessionParams = {
  menteeId: string;
  mentorId?: string; // If undefined, triggers Gemini matching loop
  serviceType: ServiceType;
  scheduledAt: string;
  menteeGoals: string;
  menteeBackground: string;
  includePreCallBrief?: boolean;
  durationMinutes?: number; // from slider for variable 1:1; used for prorated price + persisted
  campaignId?: string;
  marketingReferrer?: string;
  /** Single-use complimentary 15-min grant (server-validated). */
  applyCompGrantId?: string;
  /** Space Path Assessment public token — sets bookings.path_assessment_id when valid. */
  assessmentToken?: string;
  /** Claimed email-locked guest invite. 25 minutes with Chris at $0. */
  guestInviteId?: string;
  menteeEmail?: string;
  offerSlug?: string;
};

type LoadedOffer = OfferSnapshot & {
  id: string;
  status: string;
};

export class BookingAgent {
  private agentId = 'APX-01' as const;

  /**
   * Orchestrates the scheduling and creates an immediate-capture PaymentIntent.
   */
  async bookSession(params: BookSessionParams) {
    await this.logAudit('BOOKING_INITIATED', null, {
      mentee_id: params.menteeId,
      mentor_id: params.mentorId ?? null,
      service_type: params.serviceType,
      scheduled_at: params.scheduledAt,
      has_goals: Boolean(params.menteeGoals?.trim()),
      has_background: Boolean(params.menteeBackground?.trim()),
    });

    // Defense-in-depth: same 2-day lead as BookBodySchema (covers callers that skip schema).
    if (!isScheduledAtOnOrAfterEarliestBookable(params.scheduledAt)) {
      throw new Error(BOOKING_LEAD_TIME_ERROR);
    }

    let campaignSlotReserved = false;
    if (params.campaignId) {
      const reserved = await reserveChrisCampaignSlot(params.campaignId);
      if (!reserved) {
        throw new ChrisCampaignSoldOutError();
      }
      campaignSlotReserved = true;
      await this.logAudit('CHRIS_CAMPAIGN_SLOT_RESERVED', null, {
        campaign_id: params.campaignId,
      });
    }

    try {
      return await this.createBookingAfterSlotReserve(params);
    } catch (error) {
      if (campaignSlotReserved && params.campaignId) {
        try {
          await releaseChrisCampaignSlot(params.campaignId);
          await this.logAudit('CHRIS_CAMPAIGN_SLOT_RELEASED', null, {
            campaign_id: params.campaignId,
            reason: 'booking_failed',
          });
        } catch {
          // Best-effort release; original error is more important to surface.
        }
      }
      throw error;
    }
  }

  private async createBookingAfterSlotReserve(params: BookSessionParams) {
    let finalMentorId = params.mentorId;
    let matchReason = 'User selected mentor directly.';
    let didRunMatcher = false;
    let appliedCompGrantId: string | null = null;
    let appliedGuestInviteId: string | null = null;
    let guestInviteReferrer: string | null = null;
    let pathAssessmentId: string | null = null;

    if (params.assessmentToken?.trim()) {
      const token = params.assessmentToken.trim();
      const { data: assessment } = await supabaseAdmin
        .from('path_assessments')
        .select('id')
        .eq('public_token', token)
        .maybeSingle();
      if (assessment?.id) {
        pathAssessmentId = assessment.id;
      }
    }

    // Offer checkout always names the mentor; do not run Gemini match.
    if (!finalMentorId) {
      if (params.offerSlug) {
        throw new Error('This session is not available.');
      }
      const matchResult = await this.matchMentor({
        menteeId: params.menteeId,
        menteeGoals: params.menteeGoals,
        menteeBackground: params.menteeBackground,
        serviceType: params.serviceType,
      });
      finalMentorId = matchResult.mentor_id;
      matchReason = matchResult.match_reason;
      didRunMatcher = true;
    }

    if (!finalMentorId) {
      throw new ExpertMatchFailedError(
        'Gemini could not match you to a listed expert from these goals. Add more detail, or choose someone from the directory.',
      );
    }

    // offered_services and timezone are not in database.types.ts yet.
    const { data: mentor, error: mentorErr } = await (
      supabaseAdmin.from('mentors') as unknown as {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            single: () => Promise<{
              data: {
                stripe_connect_account_id: string | null;
                live_session_price_cents: number;
                is_listed: boolean;
                compliance_status: string;
                slug: string | null;
                full_name: string;
                timezone: string | null;
                offered_services: string[] | null;
                expert_offers_enabled: boolean | null;
              } | null;
              error: { message: string } | null;
            }>;
          };
        };
      }
    )
      .select(
        'stripe_connect_account_id, live_session_price_cents, is_listed, compliance_status, slug, full_name, timezone, offered_services, expert_offers_enabled',
      )
      .eq('id', finalMentorId)
      .single();

    if (mentorErr || !mentor) {
      throw new Error('Expert lookup failed.');
    }

    if (mentor.compliance_status !== 'approved' || !mentor.is_listed) {
      throw new Error('This expert is not available for booking.');
    }

    // To update the base price for Stripe:
    // - For normal experts: edit `live_session_price_cents` in the mentors table (Supabase).
    // - For Chris: whole-dollar duration menu in chris-campaign-constants ($250/hr anchor).

    let offer: LoadedOffer | null = null;
    if (params.offerSlug) {
      if (params.campaignId) {
        throw new Error('This session is booked from its share link, not the campaign checkout.');
      }
      if (params.applyCompGrantId) {
        throw new Error('Complimentary sessions do not apply to packaged offers.');
      }

      const { data: offerRow } = await supabaseAdmin
        .from('expert_offers')
        .select('id, title, slug, duration_minutes, price_cents, status')
        .eq('mentor_id', finalMentorId)
        .eq('slug', params.offerSlug)
        .maybeSingle();

      if (
        !offerRow ||
        !isOfferPubliclyBookable({
          status: offerRow.status,
          expert_offers_enabled: Boolean(mentor.expert_offers_enabled),
          compliance_status: mentor.compliance_status,
          is_listed: mentor.is_listed,
        })
      ) {
        throw new Error('This session is not available.');
      }

      offer = {
        id: offerRow.id,
        offer_id: offerRow.id,
        title: offerRow.title,
        slug: offerRow.slug,
        duration_minutes: offerRow.duration_minutes,
        price_cents: offerRow.price_cents,
        status: offerRow.status,
      };
    }

    const isChrisCampaign = Boolean(params.campaignId);
    let durationMinutes = offer
      ? offer.duration_minutes
      : isChrisCampaign
        ? clampSessionDurationMinutes(
            params.durationMinutes ?? CHRIS_SESSION_DURATION_MINUTES,
          )
        : params.durationMinutes;
    const serviceType = offer ? 'packaged_offer' : params.serviceType;

    if (params.guestInviteId) {
      if (offer) {
        throw new Error('Invites do not apply to packaged offers.');
      }
      if (!params.menteeEmail) {
        throw new Error('Sign in to use this invite.');
      }
      const invite = await getInviteForBooking({
        inviteId: params.guestInviteId,
        userId: params.menteeId,
        email: params.menteeEmail,
      });
      if (!finalMentorId || finalMentorId !== invite.mentorId) {
        throw new Error('This invite is only for a session with Chris.');
      }
      if (!params.campaignId) {
        throw new Error('This invite is only for a session with Chris.');
      }
      durationMinutes = GUEST_INVITE_DURATION_MINUTES;
      guestInviteReferrer = invite.marketingReferrer;
      await assertChrisWindowFree({
        mentorId: invite.mentorId,
        scheduledAt: params.scheduledAt,
        durationMinutes,
      });
      appliedGuestInviteId = invite.id;
    }

    // timezone is null until the offer wizard is saved. Those experts keep both services.
    // A packaged offer is its own SKU and does not use the weekly service menu or hours.
    if (!offer && mentor.timezone != null) {
      const offeredServices = Array.isArray(mentor.offered_services)
        ? mentor.offered_services
        : ['session_1on1'];
      if (!offeredServices.includes(serviceType)) {
        throw new ExpertOfferBookingError('This expert does not offer that service.');
      }
    }

    const storedDurationMinutes =
      durationMinutes ?? (serviceType === 'session_1on1' ? 30 : 15);

    if (!offer) {
      const hours = await loadMentorWindows(finalMentorId);
      if (hours.windows.length > 0) {
        const mentorZone = typeof mentor.timezone === 'string' ? mentor.timezone.trim() : '';
        const timezone = mentorZone || 'America/Chicago';
        if (
          !offerSchema.windowContains(
            hours.windows,
            timezone,
            params.scheduledAt,
            storedDurationMinutes,
          )
        ) {
          throw new ExpertOfferBookingError("That time is outside this expert's hours.");
        }
      }
    }

    if (params.applyCompGrantId) {
      if (serviceType !== 'session_1on1') {
        throw new Error('Complimentary session only applies to live 1:1 bookings.');
      }
      const grant = await getGrantForApply({
        grantId: params.applyCompGrantId,
        userId: params.menteeId,
      });
      assertGrantApplicable({
        grant,
        menteeId: params.menteeId,
        durationMinutes,
      });
      appliedCompGrantId = grant.id;
    }

    // Briefing (APX-02) is always included for live sessions as part of the standard offering.
    // Duration (slider) makes 1:1 price variable (prorated hourly rate from live_session_price_cents).
    const includePreCallBrief = serviceType === 'session_1on1' || serviceType === 'packaged_offer';
    let servicePriceCents = computeBookingTotalCents({
      serviceType,
      liveSessionPriceCents: mentor.live_session_price_cents,
      includePreCallBrief,
      durationMinutes,
      ...(offer ? { offerPriceCents: offer.price_cents } : {}),
    });

    // Chris: list/charge from whole-dollar menu by duration; tier from marketing_referrer.
    if (isChrisCampaign && !offer) {
      servicePriceCents = resolveChrisOriginalPriceCents(durationMinutes);
    }

    const chrisChargeCents =
      isChrisCampaign && !offer
        ? resolveChrisChargeCents(params.marketingReferrer, durationMinutes)
        : null;
    // Comp grant: full session free at 15 minutes. Guest invite: 25 minutes with Chris.
    let stripeAmountCents = appliedCompGrantId || appliedGuestInviteId
      ? 0
      : (chrisChargeCents ?? servicePriceCents);
    const displayAmountCents = stripeAmountCents;

    const skipPayments = isStripePaymentsSkipped();
    const isFreeSession = !skipPayments && stripeAmountCents === 0;

    let paymentIntentId: string;
    let stripeClientSecret: string | null = null;

    if (skipPayments) {
      paymentIntentId = createDevSkippedPaymentIntentId();
    } else if (isFreeSession) {
      // Stripe rejects amount: 0; free listings confirm without a PaymentIntent.
      paymentIntentId = createFreeSessionPaymentIntentId();
    } else {
      const stripeCustomerId = await getOrCreateStripeCustomerForMentee(params.menteeId);

      const idempotencyKey = `astrolink_book_${params.menteeId}_${finalMentorId}_${params.scheduledAt}_${crypto.randomUUID()}`;

      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: stripeAmountCents,
        currency: 'usd',
        metadata: {
          app: 'astrolink',
          mentor_id: finalMentorId,
          mentee_id: params.menteeId,
          service_type: serviceType,
          ...(offer ? { offer_id: offer.id } : {}),
          ...(params.campaignId ? { campaign_id: params.campaignId } : {}),
          ...(isChrisCampaign && chrisChargeCents != null
            ? {
                pricing_mode: chrisPricingMode(params.marketingReferrer),
                pricing_tier: resolveChrisPricingTier(params.marketingReferrer),
                original_amount_cents: String(
                  resolveChrisOriginalPriceCents(durationMinutes),
                ),
                charged_amount_cents: String(chrisChargeCents),
                duration_minutes: String(durationMinutes),
                ...(resolveChrisPricingTier(params.marketingReferrer) === 'early_access'
                  ? {
                      discount_label: CHRIS_DISCOUNT_NAME,
                    }
                  : {}),
              }
            : {}),
          ...(params.marketingReferrer
            ? { marketing_referrer: params.marketingReferrer }
            : {}),
        },
      };

      if (stripeCustomerId) {
        paymentIntentParams.customer = stripeCustomerId;
      }

      const paymentIntent = await stripe.paymentIntents.create(
        paymentIntentParams,
        { idempotencyKey },
      );

      paymentIntentId = paymentIntent.id;
      stripeClientSecret = paymentIntent.client_secret;
    }

    const matchFields = resolveBookingMatchFields({
      menteeGoals: params.menteeGoals,
      llmMatchReason: matchReason,
      didRunMatcher,
    });

    const offerSnapshot: OfferSnapshot | null = offer
      ? {
          offer_id: offer.id,
          title: offer.title,
          slug: offer.slug,
          duration_minutes: offer.duration_minutes,
          price_cents: offer.price_cents,
        }
      : null;

    const bookingInsert = {
      mentee_id: params.menteeId,
      mentor_id: finalMentorId,
      service_type: serviceType,
      include_pre_call_brief: includePreCallBrief,
      status: 'pending_payment' as const,
      scheduled_at: params.scheduledAt,
      stripe_payment_intent_id: paymentIntentId,
      match_reason: matchFields.buyerGoals,
      ai_match_reason: matchFields.aiMatchReason,
      intake_background: params.menteeBackground || null,
      // Persist chosen duration for variable sessions (prorated price already used for PI).
      // Defaults via migration for legacy rows; new bookings always provide from slider.
      duration_minutes: storedDurationMinutes,
      ...(params.campaignId ? { campaign_id: params.campaignId } : {}),
      ...((guestInviteReferrer ?? params.marketingReferrer)
        ? { marketing_referrer: guestInviteReferrer ?? params.marketingReferrer }
        : {}),
      ...(pathAssessmentId ? { path_assessment_id: pathAssessmentId } : {}),
      ...(offer
        ? {
            expert_offer_id: offer.id,
            offer_snapshot: offerSnapshot,
          }
        : {}),
    };

    const { data: booking, error: bookingErr } = await (
      supabaseAdmin.from('bookings') as unknown as {
        insert: (values: Record<string, unknown>) => {
          select: () => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> };
        };
      }
    )
      .insert(bookingInsert)
      .select()
      .single();

    if (bookingErr || !booking) {
      throw new Error(
        `Failed to create database booking: ${bookingErr?.message ?? 'no row returned'}`,
      );
    }

    if (offer) {
      await incrementOfferCounter(offer.id, 'checkout_starts');
    }

    if (skipPayments || isFreeSession) {
      await this.logAudit('BOOKING_CREATED', booking.id, {
        booking_id: booking.id,
        skip_payments: skipPayments,
        free_session: isFreeSession,
        comp_grant_id: appliedCompGrantId,
        guest_invite_id: appliedGuestInviteId,
      });

      if (appliedGuestInviteId) {
        const redeemed = await redeemGuestInviteForBooking({
          inviteId: appliedGuestInviteId,
          userId: params.menteeId,
          bookingId: booking.id,
        });
        if (!redeemed) {
          await supabaseAdmin
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', booking.id);
          await this.logAudit('GUEST_INVITE_REDEEM_FAILED', booking.id, {
            invite_id: appliedGuestInviteId,
          });
          throw new Error('This complimentary session could not be applied.');
        }
        await this.logAudit('GUEST_INVITE_REDEEMED', booking.id, {
          invite_id: appliedGuestInviteId,
        });
      }

      if (appliedCompGrantId) {
        const redeemed = await redeemGrantForBooking({
          grantId: appliedCompGrantId,
          userId: params.menteeId,
          bookingId: booking.id,
        });
        if (!redeemed) {
          await supabaseAdmin
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', booking.id);
          await this.logAudit('COMP_GRANT_REDEEM_FAILED', booking.id, {
            grant_id: appliedCompGrantId,
          });
          throw new Error('Complimentary session could not be applied.');
        }
        await this.logAudit('COMP_GRANT_REDEEMED', booking.id, {
          grant_id: appliedCompGrantId,
        });
      }

      await confirmBookingWithoutPayment(booking.id);

      return {
        bookingId: booking.id,
        stripeClientSecret: null,
        skipPayment: true,
        matchReason: matchFields.buyerGoals,
        amountCents: displayAmountCents,
        mentorId: finalMentorId,
        mentorSlug: mentor.slug ?? null,
        mentorName: mentor.full_name,
        aiMatchReason: matchFields.aiMatchReason,
        matchedByGemini: didRunMatcher,
      };
    }

    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: {
        app: 'astrolink',
        mentor_id: finalMentorId,
        mentee_id: params.menteeId,
        service_type: serviceType,
        booking_id: booking.id,
        ...(offer ? { offer_id: offer.id } : {}),
      },
    });

    await this.logAudit('BOOKING_CREATED', booking.id, {
      booking_id: booking.id,
      stripe_intent_id: paymentIntentId,
    });

    return {
      bookingId: booking.id,
      stripeClientSecret,
      skipPayment: false,
      matchReason: matchFields.buyerGoals,
      amountCents: displayAmountCents,
      mentorId: finalMentorId,
      mentorSlug: mentor.slug ?? null,
      mentorName: mentor.full_name,
      aiMatchReason: matchFields.aiMatchReason,
      matchedByGemini: didRunMatcher,
    };
  }

  /**
   * Matches a mentee with the optimal mentor using the configured LLM.
   */
  private async matchMentor(input: {
    menteeId: string;
    menteeGoals: string;
    menteeBackground: string;
    serviceType: string;
  }): Promise<MatchingOutput> {
    return matchListedMentor({
      menteeGoals: input.menteeGoals,
      menteeBackground: input.menteeBackground,
      serviceType: input.serviceType,
      rateLimitKey: input.menteeId,
      agentId: this.agentId,
      operation: 'expert_match',
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
