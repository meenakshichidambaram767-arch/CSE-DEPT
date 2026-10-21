import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

// PUT /api/v1/reviews/sessions/[id]/notes - Update Review Meeting Notes (HOD Only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['HOD']);
    const { id } = await params;
    const body = await request.json();

    const meeting_notes = body.meeting_notes || body.notes;
    const next_week_goal = body.next_week_goal || body.nextWeekGoal;

    if (!meeting_notes || typeof meeting_notes !== 'string' || !meeting_notes.trim()) {
      return apiError(
        'VALIDATION_ERROR',
        'meeting_notes is required and must not be empty.',
        400,
        { field: 'meeting_notes' }
      );
    }

    const supabase = await createClient();

    let sessionUUID = id;
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
      sessionUUID = found.id;
    }

    const { data: updated, error: updateErr } = await supabase
      .from('review_sessions')
      .update({
        meeting_notes: meeting_notes.trim(),
        next_week_goal: next_week_goal ? next_week_goal.trim() : null,
      })
      .eq('id', sessionUUID)
      .select('id, meeting_notes, next_week_goal')
      .single();

    if (updateErr) {
      console.error('Error updating review meeting notes:', updateErr);
      return apiError('DATABASE_ERROR', updateErr.message, 500);
    }

    return apiSuccess({
      session_id: sessionUUID,
      meeting_notes: updated?.meeting_notes || meeting_notes.trim(),
      next_week_goal: updated?.next_week_goal || next_week_goal || null,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return apiError('FORBIDDEN', 'Access denied. HOD role required.', 403);
    }
    console.error('Error in PUT /api/v1/reviews/sessions/[id]/notes:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred while updating notes.', 500);
  }
}
