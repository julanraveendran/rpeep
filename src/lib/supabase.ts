import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client using the service role key. It must never be imported from a client
 * component: the key would reach the browser bundle (PRD section 4, rule 5; checked by `npm run check:bundle`).
 * Row Level Security is on with no policies, so only this client can read or write.
 */
export function createServiceClient(options: { url: string; serviceRoleKey: string }): SupabaseClient {
  return createClient(options.url, options.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
