import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireRole(['HOD']);
    const { id } = await params;
    const body = await request.json();

    const { decision, remarks, rejection_reason, revision_notes } = body;

    // Validate allowed decisions
    const allowedDecisions = ['APPROVED', 'REJECTED', 'REVISION_REQUESTED'];
    if (!allowedDecisions.includes(decision)) {
      return apiError(
        'INVALID_DECISION',
        `Decision must be one of: ${allowedDecisions.join(', ')}`,
        400,
        { field: 'decision' }
      );
    }

    // Validate mandatory reasons/notes per API Contract v2.0
    if (decision === 'REJECTED' && (!rejection_reason || !rejection_reason.trim())) {
      return apiError(
        'REJECTION_REASON_REQUIRED',
        'Rejection reason must be supplied when rejecting an OD request.',
        400,
        { field: 'rejection_reason' }
      );
    }

    if (decision === 'REVISION_REQUESTED' && (!revision_notes || !revision_notes.trim())) {
      return apiError(
        'REVISION_NOTES_REQUIRED',
        'Notes must be supplied for revision requests.',
        400,
        { field: 'revision_notes' }
      );
    }

    const supabase = await createClient();

    // Resolve target UUID if code (e.g., OD-2026-0001) was passed
    let targetUUID = id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      const { data: found, error: lookupErr } = await supabase
        .from('od_requests')
        .select('id')
        .eq('code', id)
        .single();

      if (lookupErr || !found) {
        return apiError('NOT_FOUND', 'OD request not found.', 404);
      }
      targetUUID = found.id;
    }

    // Call atomic PostgreSQL transaction stored procedure
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'exec_hod_od_decision',
      {
        p_od_id: targetUUID,
        p_actor_id: authUser.id,
        p_decision: decision,
        p_remarks: remarks || null,
        p_rejection_reason: rejection_reason || null,
        p_revision_notes: revision_notes || null,
      }
    );

    if (rpcError) {
      console.error('RPC Error executing exec_hod_od_decision:', rpcError);
      
      if (rpcError.code === 'P0001') {
        return apiError('FORBIDDEN', rpcError.message, 403);
      }
      if (['P0002', 'P0003', 'P0004'].includes(rpcError.code)) {
        return apiError('VALIDATION_ERROR', rpcError.message, 400);
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
    console.error('Error in POST /api/v1/od-requests/[id]/decision:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
