try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('server-only');
} catch {
  // Allow test runners and CLI scripts to run without Next.js server-only bundling error
}

import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

export async function createClient() {
  if (typeof (globalThis as any).__MOCK_SUPABASE_CLIENT__ === 'function') {
    return (globalThis as any).__MOCK_SUPABASE_CLIENT__();
  }
  const cookieStore = await cookies();
  let authHeader: string | null = null;
  try {
    const headerStore = await headers();
    authHeader = headerStore.get('authorization');
  } catch {
    // Non-blocking outside of request context
  }

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

  return createServerClient(
    supabaseUrl || 'https://placeholder-project.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key',
    {
      global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set({ name, value, ...options })
            );
          } catch {
            // Handled in middleware session refresh
          }
        },
      },
    }
  );
}

export async function createSupabaseServerClient() {
  return createClient();
}
