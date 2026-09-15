import 'server-only';
import type { Database } from '@/lib/database.types';
import { supabaseAdmin } from '@/lib/supabase';

export type OfferCounter = 'page_views' | 'checkout_starts' | 'bookings_paid';

type ExpertOfferUpdate = Database['public']['Tables']['expert_offers']['Update'];

export async function incrementOfferCounter(offerId: string, column: OfferCounter): Promise<void> {
  const { data } = await supabaseAdmin
    .from('expert_offers')
    .select(column)
    .eq('id', offerId)
    .maybeSingle();
  const current = Number((data as Record<string, number> | null)?.[column] ?? 0);
  const patch: ExpertOfferUpdate = {
    [column]: current + 1,
    updated_at: new Date().toISOString(),
  };
  await supabaseAdmin.from('expert_offers').update(patch).eq('id', offerId);
}
