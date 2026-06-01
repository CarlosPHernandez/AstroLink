import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

let supabaseClient: SupabaseClient<Database> | null = null;
let supabaseAdminClient: SupabaseClient<Database> | null = null;

function requireSupabaseUrl(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set.');
  }
  return supabaseUrl;
}

export function getSupabase(): SupabaseClient<Database> {
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(
      requireSupabaseUrl(),
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    );
  }
  return supabaseClient;
}

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient<Database>(
      requireSupabaseUrl(),
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }
  return supabaseAdminClient;
}

/** Lazy public client — avoids throwing during `next build` when env is absent. */
export const supabase: SupabaseClient<Database> = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    const client = getSupabase();
    const value = Reflect.get(client, prop, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

/** Lazy admin client — avoids throwing during `next build` when env is absent. */
export const supabaseAdmin: SupabaseClient<Database> = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    const value = Reflect.get(client, prop, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
