import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

// POST /api/v1/od-requests/bulk-decision - Atomic HOD Decision on Multiple OD Requests
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireRole(['HOD']);
    const body = await request.json();

    const {
      ids,
      decision,
      remarks,
      rejection_reason,
      revision_notes,
      revision_remarks,
    } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return apiError(
        'VALIDATION_ERROR',
        'ids must be a non-empty array of OD request IDs.',
        400,
        { field: 'ids' }
      );
    }

    const allowedDecisions = ['APPROVED', 'REJECTED', 'REVISION_REQUESTED'];
    if (!decision || !allowedDecisions.includes(decision)) {
      return apiError(
        'INVALID_DECISION',
        `Decision must be one of: ${allowedDecisions.join(', ')}`,
        400,
        { field: 'decision' }
      );
    }

    const notes = revision_notes || revision_remarks;
    if (decision === 'REJECTED' && (!rejection_reason || !rejection_reason.trim())) {
      return apiError(
        'REJECTION_REASON_REQUIRED',
        'Rejection reason must be supplied when rejecting OD requests.',
        400,
        { field: 'rejection_reason' }
      );
    }

    if (decision === 'REVISION_REQUESTED' && (!notes || !notes.trim())) {
      return apiError(
        'REVISION_NOTES_REQUIRED',
        'Notes must be supplied for revision requests.',
        400,
        { field: 'revision_notes' }
      );
    }

    const supabase = await createClient();
    const results: Array<{
      id: string;
      success: boolean;
      status?: string;
      code?: string;
      error?: string;
    }> = [];

    for (const rawId of ids) {
      try {
        let targetUUID = String(rawId).trim();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUUID);

        if (!isUuid) {
          const { data: found, error: lookupErr } = await supabase
            .from('od_requests')
            .select('id')
            .eq('code', targetUUID)
            .single();

          if (lookupErr || !found) {
            results.push({
              id: targetUUID,
              success: false,
              error: `OD request not found with code: ${targetUUID}`,
            });
            continue;
          }
          targetUUID = found.id;
        }

        const { data: rpcResult, error: rpcError } = await supabase.rpc(
          'exec_hod_od_decision',
          {
            p_od_id: targetUUID,
            p_actor_id: authUser.id,
            p_decision: decision,
            p_remarks: remarks || null,
            p_rejection_reason: rejection_reason || null,
            p_revision_notes: notes || null,
          }
        );

        if (rpcError) {
          results.push({
            id: targetUUID,
            success: false,
            error: rpcError.message,
          });
        } else {
          results.push({
            id: targetUUID,
            success: true,
            status: decision,
            code: rpcResult?.code,
          });
        }
      } catch (err: unknown) {
        results.push({
          id: String(rawId),
          success: false,
          error: err instanceof Error ? err.message : 'Unknown execution error',
        });
      }
    }

    const updatedCount = results.filter((r) => r.success).length;

    return apiSuccess({
      decision,
      updated_count: updatedCount,
      results,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return apiError('FORBIDDEN', 'Access denied. HOD role required.', 403);
    }
    console.error('Error in POST /api/v1/od-requests/bulk-decision:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred during bulk decision.', 500);
  }
}
