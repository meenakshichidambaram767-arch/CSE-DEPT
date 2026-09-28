export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
}

/**
 * Reads only values that Supabase permits in a browser bundle. The anon key is
 * still protected by Supabase RLS; it is not a replacement for authorization.
 */
export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return { url, anonKey };
}
