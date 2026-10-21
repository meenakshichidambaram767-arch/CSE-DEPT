import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (process.env.NODE_ENV === 'production') {
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing or contains placeholder in production.');
    }
    if (!serviceRoleKey || serviceRoleKey.includes('placeholder')) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing or contains placeholder in production.');
    }
  }

  return createSupabaseClient(
    supabaseUrl || 'https://placeholder-project.supabase.co',
    serviceRoleKey || 'placeholder-service-role-key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
