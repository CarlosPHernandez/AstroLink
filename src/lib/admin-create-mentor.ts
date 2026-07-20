import 'server-only';

import { z } from 'zod';

import { supabaseAdmin } from '@/lib/supabase';

export const CreateMentorBodySchema = z.object({
  email: z.string().email().max(200),
  fullName: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase kebab-case'),
  title: z.string().trim().max(160).optional().default('Expert'),
  employer: z.string().trim().max(160).optional().default('AstroLink'),
  expertise: z.array(z.string().trim().min(1).max(80)).max(12).optional().default([]),
  bio: z.string().trim().max(4000).optional().default(''),
  /** Hourly rate in USD cents. 0 = free sessions. */
  liveSessionPriceCents: z.number().int().min(0).max(10_000_00).optional().default(0),
  isListed: z.boolean().optional().default(true),
  complianceStatus: z
    .enum([
      'approved',
      'pending_review',
      'document_required',
      'stripe_incomplete',
      'awaiting_human_approval',
      'rejected',
    ])
    .optional()
    .default('approved'),
});

export type CreateMentorBody = z.infer<typeof CreateMentorBodySchema>;

export type CreateMentorResult = {
  id: string;
  email: string;
  fullName: string;
  slug: string;
  liveSessionPriceCents: number;
  isListed: boolean;
  complianceStatus: string;
  bookHref: string;
  created: boolean;
};

export async function createOrUpdateMentor(input: CreateMentorBody): Promise<CreateMentorResult> {
  const email = input.email.trim().toLowerCase();
  const slug = input.slug.trim().toLowerCase();

  const row = {
    email,
    full_name: input.fullName.trim(),
    slug,
    title: input.title?.trim() || 'Expert',
    employer: input.employer?.trim() || 'AstroLink',
    expertise: input.expertise?.length ? input.expertise : ['Session Ops'],
    bio: input.bio?.trim() || 'Listed expert profile.',
    live_session_price_cents: input.liveSessionPriceCents ?? 0,
    compliance_status: input.complianceStatus ?? 'approved',
    is_listed: input.isListed ?? true,
    stripe_onboarding_completed: false,
  };

  const { data: existingByEmail } = await supabaseAdmin
    .from('mentors')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingByEmail?.id) {
    const { data, error } = await supabaseAdmin
      .from('mentors')
      .update(row)
      .eq('id', existingByEmail.id)
      .select(
        'id, email, full_name, slug, live_session_price_cents, is_listed, compliance_status',
      )
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to update mentor');
    }

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      slug: data.slug ?? slug,
      liveSessionPriceCents: data.live_session_price_cents,
      isListed: data.is_listed,
      complianceStatus: data.compliance_status,
      bookHref: `/booking?mentor=${encodeURIComponent(data.slug ?? slug)}`,
      created: false,
    };
  }

  const { data: slugTaken } = await supabaseAdmin
    .from('mentors')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (slugTaken?.id) {
    throw new Error(`Slug "${slug}" is already used by another mentor.`);
  }

  const { data, error } = await supabaseAdmin
    .from('mentors')
    .insert(row)
    .select('id, email, full_name, slug, live_session_price_cents, is_listed, compliance_status')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create mentor');
  }

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    slug: data.slug ?? slug,
    liveSessionPriceCents: data.live_session_price_cents,
    isListed: data.is_listed,
    complianceStatus: data.compliance_status,
    bookHref: `/booking?mentor=${encodeURIComponent(data.slug ?? slug)}`,
    created: true,
  };
}
