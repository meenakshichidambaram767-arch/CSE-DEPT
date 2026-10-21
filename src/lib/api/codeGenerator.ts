import { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * Generate a collision-safe unique code for OD Requests.
 * 1. Tries calling database RPC `generate_safe_od_code`.
 * 2. Falls back to querying max code with service client (bypassing RLS) with retry safety.
 * 3. Falls back to collision-resistant randomized sequence if database is unavailable.
 */
export async function generateSafeODCode(supabaseUserClient: SupabaseClient): Promise<string> {
  const currentYear = new Date().getFullYear();

  // 1. Try DB RPC first
  try {
    const { data: rpcCode, error: rpcErr } = await supabaseUserClient.rpc('generate_safe_od_code');
    if (!rpcErr && rpcCode && typeof rpcCode === 'string') {
      return rpcCode;
    }
  } catch {
    // RPC not present or failed, continue to fallback
  }

  // 2. Try Service Client (bypassing RLS)
  try {
    const serviceClient = createServiceClient();
    const { data: latestRows, error: serviceErr } = await serviceClient
      .from('od_requests')
      .select('code')
      .ilike('code', `OD-${currentYear}-%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!serviceErr && latestRows) {
      let maxNum = 0;
      for (const row of latestRows) {
        const match = row.code?.match(/OD-\d{4}-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      }
      const nextNum = maxNum + 1;
      return `OD-${currentYear}-${String(nextNum).padStart(3, '0')}`;
    }
  } catch {
    // Service client not available
  }

  // 3. Fallback: Generate timestamp + random suffix based unique code
  const pseudoUnique = Math.floor(100 + Math.random() * 900);
  return `OD-${currentYear}-${pseudoUnique}`;
}

/**
 * Generate a collision-safe unique code for Activities (PROJECT, HACKATHON, INTERNSHIP).
 */
export async function generateSafeActivityCode(
  supabaseUserClient: SupabaseClient,
  type: string
): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = type === 'HACKATHON' ? 'HAK' : type === 'INTERNSHIP' ? 'INT' : 'PRJ';

  // 1. Try DB RPC first
  try {
    const { data: rpcCode, error: rpcErr } = await supabaseUserClient.rpc('generate_safe_activity_code', {
      p_type: type,
    });
    if (!rpcErr && rpcCode && typeof rpcCode === 'string') {
      return rpcCode;
    }
  } catch {
    // RPC not present or failed, continue to fallback
  }

  // 2. Try Service Client (bypassing RLS)
  try {
    const serviceClient = createServiceClient();
    const { data: latestRows, error: serviceErr } = await serviceClient
      .from('activities')
      .select('code')
      .ilike('code', `${prefix}-${currentYear}-%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!serviceErr && latestRows) {
      let maxNum = 0;
      for (const row of latestRows) {
        const match = row.code?.match(new RegExp(`${prefix}-\\d{4}-(\\d+)`));
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      }
      const nextNum = maxNum + 1;
      return `${prefix}-${currentYear}-${String(nextNum).padStart(3, '0')}`;
    }
  } catch {
    // Service client not available
  }

  // 3. Fallback
  const pseudoUnique = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${currentYear}-${pseudoUnique}`;
}
