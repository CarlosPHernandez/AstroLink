import type { Json } from '@/lib/database.types';
import { ai, callGeminiWithBackoff } from '@/lib/gemini';
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
    const bioCheck = await this.scanBioForCivilServantSignal(params.bio);
    const isCivilServant = params.isCivilServantDeclared || bioCheck.is_civil_servant_flag;

    let complianceStatus: 'stripe_incomplete' | 'document_required' = 'stripe_incomplete';

    if (isCivilServant) {
      complianceStatus = 'document_required';
      await this.logAudit('CIVIL_SERVANT_DETECTED', mentorDbId, { bioCheck });
      
      // If PDF document buffer is uploaded, perform multimodal parsing
      if (params.nf1860PdfBuffer) {
        const docAnalysis = await this.parseNF1860Form(params.nf1860PdfBuffer);
        
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
   * Scans bio text using Gemini for civil-servant triggers.
   */
  private async scanBioForCivilServantSignal(bio: string): Promise<{
    is_civil_servant_flag: boolean;
    risk_rating: 'low' | 'medium' | 'high';
    reasoning: string;
  }> {
    const systemInstruction = `
      Analyze this aerospace professional bio for implicit signals that the person is currently an active federal civil servant or direct government contractor.
      Look for current tense roles at federal agencies (NASA, FAA, Space Force) or national labs (JPL, Sandia).
      Flag risk strictly. Return JSON.
    `;

    const runCall = async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: bio,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              is_civil_servant_flag: { type: 'BOOLEAN' },
              risk_rating: { type: 'STRING', enum: ['low', 'medium', 'high'] },
              reasoning: { type: 'STRING' },
            },
            required: ['is_civil_servant_flag', 'risk_rating', 'reasoning'],
          },
        },
      });

      return JSON.parse(response.text || '{}');
    };

    return callGeminiWithBackoff(runCall);
  }

  /**
   * Multimodal Form Parsing for NASA Form NF-1860 PDF (using Gemini Pro).
   */
  private async parseNF1860Form(pdfBuffer: Buffer): Promise<ComplianceReviewOutput> {
    const systemInstruction = `
      You are AstraLink's aerospace regulatory compliance officer. Analyze this NASA Form NF-1860 (Outside Employment Approval). Evaluate authenticity and complete details.
      Ensure:
      1. Supervisor and Center Director signatures are physically or digitally present.
      2. The expiration date is in the future.
      3. No restrictions prohibit participating in private consulting.
      Identify any discrepancies, omissions, or anomalies. Return valid JSON only.
    `;

    const runCall = async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [
          {
            inlineData: {
              data: pdfBuffer.toString('base64'),
              mimeType: 'application/pdf',
            },
          },
          'Analyze this NASA Outside Employment approval form for signatures, expirations, and restrictions.',
        ],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
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
        },
      });

      return JSON.parse(response.text || '{}') as ComplianceReviewOutput;
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
