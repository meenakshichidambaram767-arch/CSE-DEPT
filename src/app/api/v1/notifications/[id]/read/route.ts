import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

// PATCH /api/v1/notifications/[id]/read - Mark Notification As Read (Owner Only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth();
    const { id } = await params;

    const supabase = await createClient();

    // Verify ownership
    const { data: notif, error: fetchErr } = await supabase
      .from('notifications')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchErr || !notif) {
      return apiError('NOT_FOUND', 'Notification not found.', 404);
    }

    if (notif.user_id !== authUser.id) {
      return apiError('FORBIDDEN', 'Access denied. You can only mark your own notifications as read.', 403);
    }

    const { error: updateErr } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (updateErr) {
      console.error('Error updating notification read status:', updateErr);
      return apiError('DATABASE_ERROR', updateErr.message, 500);
    }

    const updatedAt = new Date().toISOString();

    return apiSuccess({
      id,
      is_read: true,
      updated_at: updatedAt,
      data: { success: true, id },
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    console.error('Error in PATCH /api/v1/notifications/[id]/read:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
