import type { Json } from '@/lib/database.types';
import { callLlmWithBackoff, generateStructuredJson, llmFlashModel, llmProModel } from '@/lib/llm';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { ComplianceReviewOutput } from '@/lib/types';

export class ComplianceAgent {
  private agentId = 'APX-04' as const;

  /**
   * Scans profile and sets up Stripe Connect Express onboarding.
   */
  async onboardMentor(mentorDbId: string, params: {
    fullName: string;
    email: string;
    employer: string;
    expertise: string[];
    bio: string;
    isCivilServantDeclared: boolean;
    nf1860PdfBuffer?: Buffer; // Optional document upload
  }) {
    await this.logAudit('ONBOARDING_INITIATED', mentorDbId, { email: params.email });

    // Step 1: Scan biography for government affiliations
    const bioCheck = await this.scanBioForCivilServantSignal(mentorDbId, params.bio);
    const isCivilServant = params.isCivilServantDeclared || bioCheck.is_civil_servant_flag;

    let complianceStatus: 'stripe_incomplete' | 'document_required' = 'stripe_incomplete';

    if (isCivilServant) {
      complianceStatus = 'document_required';
      await this.logAudit('CIVIL_SERVANT_DETECTED', mentorDbId, { bioCheck });
      
      // If PDF document buffer is uploaded, perform multimodal parsing
      if (params.nf1860PdfBuffer) {
        const docAnalysis = await this.parseNF1860Form(mentorDbId, params.nf1860PdfBuffer);
        
        // Write compliance review record to database
        await supabaseAdmin.from('compliance_reviews').insert({
          mentor_id: mentorDbId,
          is_civil_servant: true,
          bio_risk_rating: bioCheck.risk_rating,
          bio_analysis_reasoning: bioCheck.reasoning,
          nf1860_extracted_data: docAnalysis as unknown as Json,
        });

        await this.logAudit('NF1860_PARSED', mentorDbId, { docAnalysis });
      }
    }

    // Step 2: Provision Stripe Express Identity
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: { mentor_id: mentorDbId },
    });

    // Step 3: Generate Account Onboarding Link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'https://astralink.ai/onboard/stripe-retry',
      return_url: 'https://astralink.ai/onboard/stripe-success',
      type: 'account_onboarding',
    });

    // Update database record for Mentor
    await supabaseAdmin
      .from('mentors')
      .update({
        stripe_connect_account_id: account.id,
        is_civil_servant: isCivilServant,
        compliance_status: complianceStatus,
      })
      .eq('id', mentorDbId);

    await this.logAudit('STRIPE_ACCOUNT_PROVISIONED', mentorDbId, {
      stripe_account_id: account.id,
    });

    return {
      stripeConnectUrl: accountLink.url,
      isCivilServant,
    };
  }

  /**
   * Validates Stripe Connect Express integration credentials on redirection.
   */
  async verifyStripeOnboarding(mentorDbId: string, stripeConnectAccountId: string) {
    const stripeAccount = await stripe.accounts.retrieve(stripeConnectAccountId);
    
    if (stripeAccount.charges_enabled && stripeAccount.payouts_enabled) {
      // Transition status to awaiting human admin approval
      await supabaseAdmin
        .from('mentors')
        .update({
          stripe_onboarding_completed: true,
          compliance_status: 'awaiting_human_approval',
        })
        .eq('id', mentorDbId);

      await this.logAudit('STRIPE_ONBOARDING_COMPLETED', mentorDbId, {});
      return { success: true };
    } else {
      await supabaseAdmin
        .from('mentors')
        .update({
          compliance_status: 'stripe_incomplete',
        })
        .eq('id', mentorDbId);

      await this.logAudit('STRIPE_ONBOARDING_INCOMPLETE', mentorDbId, {});
      return { success: false };
    }
  }

  /**
   * Scans bio text using the configured LLM for civil-servant triggers.
   */
  private async scanBioForCivilServantSignal(
    mentorDbId: string,
    bio: string,
  ): Promise<{
    is_civil_servant_flag: boolean;
    risk_rating: 'low' | 'medium' | 'high';
    reasoning: string;
  }> {
    const systemInstruction = `
You are APX-04, AstroLink's compliance screening agent for mentor onboarding.

Task: Read the mentor biography and decide whether the person appears to be an active U.S. federal civil servant or a direct government employee/consultant subject to outside-employment rules.

Signals to weigh (present tense only):
- Federal agencies: NASA, FAA, Space Force, NOAA, NRO, etc.
- National labs or federally funded centers: JPL, Sandia, Lawrence Livermore, etc.
- Phrases like "currently at", "serving as", "federal employee", "GS-", "civil servant".

Do NOT flag retired, former, or clearly past roles. When uncertain, prefer medium risk over false negatives.

Return JSON only with:
- is_civil_servant_flag (boolean)
- risk_rating ("low" | "medium" | "high")
- reasoning (one or two factual sentences citing the bio text)
`;

    return callLlmWithBackoff(() =>
      generateStructuredJson<{
        is_civil_servant_flag: boolean;
        risk_rating: 'low' | 'medium' | 'high';
        reasoning: string;
      }>({
        model: llmFlashModel,
        rateLimitKey: mentorDbId,
        systemInstruction,
        prompt: bio,
        schema: {
          type: 'OBJECT',
          properties: {
            is_civil_servant_flag: { type: 'BOOLEAN' },
            risk_rating: { type: 'STRING', enum: ['low', 'medium', 'high'] },
            reasoning: { type: 'STRING' },
          },
          required: ['is_civil_servant_flag', 'risk_rating', 'reasoning'],
        },
      }),
    );
  }

  /**
   * Multimodal Form Parsing for NASA Form NF-1860 PDF.
   */
  private async parseNF1860Form(
    mentorDbId: string,
    pdfBuffer: Buffer,
  ): Promise<ComplianceReviewOutput> {
    const systemInstruction = `
You are APX-04 reviewing NASA Form NF-1860 (Request for Approval of Outside Employment and Other Activity).

Extract only what is visible on the uploaded PDF. Do not invent signatures, dates, or restrictions.

Checklist:
1. Supervisor signature present (wet ink or valid digital signature block).
2. Center Director (or designee) signature present.
3. Expiration or approval end date — mark is_expired if before today's review date.
4. Text that prohibits private consulting, paid advising, or activities competitive with NASA duties.
5. Missing pages, blank signature lines, or illegible scans — list in anomalies[].

Return valid JSON only. Use ISO dates (YYYY-MM-DD) for expiration_date when readable.
`;

    return callLlmWithBackoff(() =>
      generateStructuredJson<ComplianceReviewOutput>({
        model: llmProModel,
        rateLimitKey: mentorDbId,
        systemInstruction,
        prompt:
          'Analyze this NASA Outside Employment approval form for signatures, expirations, and restrictions.',
        files: [{ mimeType: 'application/pdf', data: pdfBuffer }],
        schema: {
          type: 'OBJECT',
          properties: {
            supervisor_signature_present: { type: 'BOOLEAN' },
            center_director_signature_present: { type: 'BOOLEAN' },
            expiration_date: { type: 'STRING' },
            is_expired: { type: 'BOOLEAN' },
            prohibits_nasa_contracts: { type: 'BOOLEAN' },
            document_appears_complete: { type: 'BOOLEAN' },
            anomalies: {
              type: 'ARRAY',
              items: { type: 'STRING' },
            },
          },
          required: [
            'supervisor_signature_present',
            'center_director_signature_present',
            'expiration_date',
            'is_expired',
            'prohibits_nasa_contracts',
            'document_appears_complete',
            'anomalies',
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
