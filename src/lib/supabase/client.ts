'use client';

import { createBrowserClient } from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';

export function createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (process.env.NODE_ENV === 'production') {
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing or contains placeholder in production.');
    }
    if (!supabaseAnonKey || supabaseAnonKey.includes('placeholder')) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or contains placeholder in production.');
    }
  }

  return createBrowserClient(
    supabaseUrl || 'https://placeholder-project.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key'
  );
}

export function getSupabaseBrowserClient(): SupabaseClient {
  return createClient();
}
