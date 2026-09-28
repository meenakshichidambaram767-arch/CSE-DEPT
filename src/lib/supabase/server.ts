import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabasePublicConfig } from './config';

/**
 * Server-only foundation for future request-aware auth integration. It uses
 * the public anon key only; service-role credentials are intentionally absent.
 */
export function createSupabaseServerClient(): SupabaseClient {
  const { url, anonKey } = getSupabasePublicConfig();
  return createClient(url, anonKey);
}
