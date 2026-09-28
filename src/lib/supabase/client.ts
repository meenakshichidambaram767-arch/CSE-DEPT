'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabasePublicConfig } from './config';

let browserClient: SupabaseClient | undefined;

/**
 * Returns the single browser client once public configuration is supplied.
 * It is deliberately lazy so the mock prototype can still run before a
 * Supabase project has been provisioned.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    const { url, anonKey } = getSupabasePublicConfig();
    browserClient = createClient(url, anonKey);
  }

  return browserClient;
}
