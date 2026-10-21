import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

// POST /api/v1/notifications/mark-all-read - Mark All User Notifications As Read
export async function POST(_request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const supabase = await createClient();

    const { error, count } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', authUser.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return apiError('DATABASE_ERROR', error.message, 500);
    }

    return apiSuccess({
      success: true,
      updated_count: count ?? 0,
      user_id: authUser.id,
      updated_at: new Date().toISOString(),
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    console.error('Error in POST /api/v1/notifications/mark-all-read:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
