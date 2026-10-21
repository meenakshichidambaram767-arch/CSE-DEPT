import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

// GET /api/v1/notifications - In-App Notifications List (Authenticated User)
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread_only') === 'true';

    const supabase = await createClient();

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error('Error querying notifications:', error);
      return apiError('QUERY_ERROR', error.message, 500);
    }

    const notifications = (rows || []).map((row: {
      id: string;
      user_id: string;
      title: string;
      message: string;
      type: string;
      is_read: boolean;
      link_url?: string | null;
      created_at: string;
    }) => ({
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      message: row.message,
      type: row.type,
      is_read: row.is_read,
      link_url: row.link_url || undefined,
      created_at: row.created_at,
    }));

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return apiSuccess({
      notifications,
      data: notifications,
      unread_count: unreadCount,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    console.error('Error in GET /api/v1/notifications:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
