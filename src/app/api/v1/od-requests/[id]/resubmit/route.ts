import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const supabase = await createClient();

    // Verify student ownership
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id, name')
      .eq('user_id', authUser.id)
      .single();

    if (!studentRecord && authUser.role === 'STUDENT') {
      return apiError(
        'STUDENT_PROFILE_NOT_FOUND',
        'Student profile not found.',
        400
      );
    }

    // Fetch OD request
    const { data: od, error: fetchError } = await supabase
      .from('od_requests')
      .select('*')
      .or(`id.eq.${id},code.eq.${id}`)
      .single();

    if (fetchError || !od) {
      return apiError('NOT_FOUND', 'OD request not found.', 404);
    }

    // Ownership check
    if (authUser.role === 'STUDENT' && studentRecord && od.student_id !== studentRecord.id) {
      return apiError('FORBIDDEN', 'You can only resubmit your own OD request.', 403);
    }

    // Precondition check: state machine transition validation
    if (od.status !== 'REVISION_REQUESTED') {
      return apiError(
        'INVALID_TRANSITION',
        `Resubmission is only allowed for requests in REVISION_REQUESTED status. Current status is '${od.status}'.`,
        422,
        { current_status: od.status, target_status: 'PENDING' }
      );
    }

    const nowIso = new Date().toISOString();
    const {
      reason,
      additional_notes,
      venue,
      from_time,
      to_time,
    } = body;

    // 1. Update od_requests back to PENDING
    const { data: updatedOD, error: updateError } = await supabase
      .from('od_requests')
      .update({
        status: 'PENDING',
        reason: reason || od.reason,
        additional_notes: additional_notes || od.additional_notes,
        venue: venue || od.venue,
        from_time: from_time || od.from_time,
        to_time: to_time || od.to_time,
        updated_at: nowIso,
      })
      .eq('id', od.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating od_request for resubmission:', updateError);
      return apiError('DATABASE_ERROR', updateError.message, 500);
    }

    // 2. Append to od_status_history
    await supabase.from('od_status_history').insert({
      od_request_id: od.id,
      old_status: 'REVISION_REQUESTED',
      new_status: 'PENDING',
      note: 'Resubmitted by student after addressing revision notes.',
      changed_by: authUser.id,
    });

    // 3. Append to audit_logs
    await supabase.from('audit_logs').insert({
      actor_id: authUser.id,
      actor_role: authUser.role,
      action_title: 'OD Request Resubmitted',
      details: `Student ${studentRecord?.name || authUser.name} resubmitted request ${od.code} for ${od.event_name}.`,
      target_id: od.id,
    });

    // 4. Notify HOD
    const { data: hodUserRecord } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'HOD')
      .limit(1)
      .single();

    if (hodUserRecord) {
      await supabase.from('notifications').insert({
        user_id: hodUserRecord.id,
        title: `OD Resubmitted: ${od.event_name}`,
        message: `${studentRecord?.name || authUser.name} resubmitted OD request for "${od.event_name}".`,
        type: 'OD_UPDATE',
        is_read: false,
        link_url: `/hod/requests/${od.id}`,
      });
    }

    return apiSuccess({
      id: updatedOD.id,
      code: updatedOD.code,
      studentId: updatedOD.student_id,
      eventName: updatedOD.event_name,
      status: updatedOD.status,
      updatedAt: updatedOD.updated_at,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    console.error('Error in PUT /api/v1/od-requests/[id]/resubmit:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
