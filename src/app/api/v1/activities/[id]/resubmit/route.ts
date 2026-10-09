import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

// PUT /api/v1/activities/[id]/resubmit - Resubmit Activity Proposal
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

    // Fetch Activity
    const { data: act, error: fetchError } = await supabase
      .from('activities')
      .select('*')
      .or(`id.eq.${id},code.eq.${id}`)
      .single();

    if (fetchError || !act) {
      return apiError('NOT_FOUND', 'Activity proposal not found.', 404);
    }

    // Ownership check
    if (authUser.role === 'STUDENT' && studentRecord && act.student_id !== studentRecord.id) {
      return apiError('FORBIDDEN', 'You can only resubmit your own activity proposal.', 403);
    }

    // Precondition check: state machine transition validation
    if (act.status !== 'REVISION_REQUESTED') {
      return apiError(
        'INVALID_TRANSITION',
        `Resubmission is only allowed for proposals in REVISION_REQUESTED status. Current status is '${act.status}'.`,
        422,
        { current_status: act.status, target_status: 'SUBMITTED' }
      );
    }

    const nowIso = new Date().toISOString();
    const {
      title,
      description,
      technologies,
      github_url,
      demo_url,
    } = body;

    // 1. Update activity back to SUBMITTED
    const { data: updatedAct, error: updateError } = await supabase
      .from('activities')
      .update({
        status: 'SUBMITTED',
        title: title ? title.trim() : act.title,
        description: description ? description.trim() : act.description,
        technologies: Array.isArray(technologies) ? technologies : act.technologies,
        github_url: github_url !== undefined ? github_url : act.github_url,
        demo_url: demo_url !== undefined ? demo_url : act.demo_url,
        updated_at: nowIso,
      })
      .eq('id', act.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating activity for resubmission:', updateError);
      return apiError('DATABASE_ERROR', updateError.message, 500);
    }

    // 2. Append to activity_status_history
    await supabase.from('activity_status_history').insert({
      activity_id: act.id,
      old_status: 'REVISION_REQUESTED',
      new_status: 'SUBMITTED',
      note: 'Resubmitted by student after addressing revision notes.',
      changed_by: authUser.id,
    });

    // 3. Append to audit_logs
    await supabase.from('audit_logs').insert({
      actor_id: authUser.id,
      actor_role: authUser.role,
      action_title: 'Activity Proposal Resubmitted',
      details: `Student ${studentRecord?.name || authUser.name} resubmitted ${act.type} proposal ${act.code} (${act.title}).`,
      target_id: act.id,
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
        title: `${act.type} Resubmitted: ${act.title}`,
        message: `${studentRecord?.name || authUser.name} resubmitted ${act.type.toLowerCase()} proposal for "${act.title}".`,
        type: 'SUBMISSION_UPDATE',
        is_read: false,
        link_url: `/hod/approvals/${act.id}`,
      });
    }

    return apiSuccess({
      id: updatedAct.id,
      code: updatedAct.code,
      studentId: updatedAct.student_id,
      type: updatedAct.type,
      title: updatedAct.title,
      status: updatedAct.status,
      updatedAt: updatedAct.updated_at,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    console.error('Error in PUT /api/v1/activities/[id]/resubmit:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
