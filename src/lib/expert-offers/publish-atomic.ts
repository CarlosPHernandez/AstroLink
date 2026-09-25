import 'server-only';
import type { Database } from '@/lib/database.types';
import { OFFER_PUBLISHED_CAP } from '@/lib/expert-offers/constants';
import { publishedCapError } from '@/lib/expert-offers/guards';
import { supabaseAdmin } from '@/lib/supabase';

type ExpertOfferRow = Database['public']['Tables']['expert_offers']['Row'];

type PublishRpcResult =
  | { ok: true; offer: ExpertOfferRow }
  | { ok: false; error: 'cap' | 'invalid_status' | 'not_found' };

export type PublishOfferAtomicResult =
  | { ok: true; offer: ExpertOfferRow }
  | { ok: false; error: string };

export async function publishOfferAtomic(params: {
  offerId: string;
  mentorId: string;
  nowIso: string;
  cap?: number;
}): Promise<PublishOfferAtomicResult> {
  const { data, error } = await supabaseAdmin.rpc('publish_expert_offer', {
    p_offer_id: params.offerId,
    p_mentor_id: params.mentorId,
    p_now: params.nowIso,
    p_cap: params.cap ?? OFFER_PUBLISHED_CAP,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const payload = data as PublishRpcResult | null;
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Could not publish session.' };
  }

  if (payload.ok === true && payload.offer) {
    return { ok: true, offer: payload.offer };
  }

  if (payload.ok === false && payload.error === 'cap') {
    return { ok: false, error: publishedCapError() };
  }
  if (payload.ok === false && payload.error === 'invalid_status') {
    return { ok: false, error: 'Only draft or unpublished sessions can be published.' };
  }
  if (payload.ok === false && payload.error === 'not_found') {
    return { ok: false, error: 'Not found' };
  }

  return { ok: false, error: 'Could not publish session.' };
}
