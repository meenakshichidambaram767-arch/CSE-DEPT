import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

// POST /api/v1/reviews/sessions/[id]/finalize - Finalize Review Session (Atomic RPC, HOD Only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireRole(['HOD']);
    const { id } = await params;
    const body = await request.json();

    const { meeting_notes, next_week_goal, next_steps } = body;
    const notes = meeting_notes || '';
    const goal = next_week_goal || next_steps || '';

    const supabase = await createClient();

    // Resolve target UUID if display code (e.g. REV-PRJ-2026-001-W1) was passed
    let targetUUID = id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      const { data: found, error: lookupErr } = await supabase
        .from('review_sessions')
        .select('id')
        .eq('code', id)
        .single();

      if (lookupErr || !found) {
        return apiError('NOT_FOUND', 'Review session not found.', 404);
      }
      targetUUID = found.id;
    }

    // Call atomic PostgreSQL transaction stored procedure
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'exec_hod_finalize_review',
      {
        p_session_id: targetUUID,
        p_actor_id: authUser.id,
        p_notes: notes || null,
        p_next_goal: goal || null,
      }
    );

    if (rpcError) {
      console.error('RPC Error executing exec_hod_finalize_review:', rpcError);

      if (rpcError.code === 'P0001') {
        return apiError('FORBIDDEN', rpcError.message, 403);
      }
      if (rpcError.code === 'P0005') {
        return apiError('NOT_FOUND', rpcError.message, 404);
      }
      if (rpcError.code === 'P0006') {
        return apiError('INVALID_TRANSITION', rpcError.message, 422);
      }

      return apiError('DATABASE_ERROR', rpcError.message, 500);
    }

    return apiSuccess(rpcResult);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return apiError('FORBIDDEN', 'HOD authorization required.', 403);
    }
    console.error('Error in POST /api/v1/reviews/sessions/[id]/finalize:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
