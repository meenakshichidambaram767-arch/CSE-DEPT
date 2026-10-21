import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';
import { serializeReviewSession } from '@/lib/api/serializers';

// POST /api/v1/reviews/sessions/[id]/cancel - Cancel Scheduled Review Session (HOD Only)
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['HOD']);
    const { id } = await params;

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

    // Verify session exists and check current status
    const { data: session, error: fetchErr } = await supabase
      .from('review_sessions')
      .select('*, activities(id, title, type)')
      .eq('id', sessionUUID)
      .single();

    if (fetchErr || !session) {
      return apiError('NOT_FOUND', 'Review session not found.', 404);
    }

    if (session.status === 'COMPLETED') {
      return apiError(
        'INVALID_TRANSITION',
        'Cannot cancel an already completed review session.',
        409
      );
    }

    const { data: updated, error: updateErr } = await supabase
      .from('review_sessions')
      .update({ status: 'CANCELLED' })
      .eq('id', sessionUUID)
      .select('*, activities(id, title, type)')
      .single();

    if (updateErr || !updated) {
      console.error('Error cancelling review session:', updateErr);
      return apiError('DATABASE_ERROR', updateErr?.message || 'Failed to cancel session', 500);
    }

    return apiSuccess(serializeReviewSession(updated));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return apiError('FORBIDDEN', 'Access denied. HOD role required.', 403);
    }
    console.error('Error in POST /api/v1/reviews/sessions/[id]/cancel:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred while cancelling review session.', 500);
  }
}
