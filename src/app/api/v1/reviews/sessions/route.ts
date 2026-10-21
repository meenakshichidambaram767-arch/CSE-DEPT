import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';
import { serializeReviewSession } from '@/lib/api/serializers';

// GET /api/v1/reviews/sessions - Filtered Review Sessions Directory
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get('activity_id');
    const status = searchParams.get('status');
    const reviewType = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('page_size') || '20', 10);

    const supabase = await createClient();

    let query = supabase
      .from('review_sessions')
      .select('*, activities!inner(*)', { count: 'exact' });

    // Role-based filtering
    if (authUser.role === 'STUDENT') {
      const { data: studentRecord } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', authUser.id)
        .single();

      if (!studentRecord) {
        return apiSuccess([], 200, { page, page_size: pageSize, total: 0 });
      }
      query = query.eq('activities.student_id', studentRecord.id);
    } else if (authUser.role === 'HOD') {
      if (activityId) {
        query = query.eq('activity_id', activityId);
      }
      if (status && status !== 'ALL') {
        query = query.eq('status', status);
      }
      if (reviewType && reviewType !== 'ALL') {
        query = query.eq('review_type', reviewType);
      }
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: rawSessions, count, error } = await query
      .order('date', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('Error querying review_sessions:', error);
      return apiError('QUERY_ERROR', error.message, 500);
    }

    const formattedSessions = (rawSessions || []).map((s: Record<string, unknown>) =>
      serializeReviewSession(s)
    );

    return apiSuccess(formattedSessions, 200, {
      page,
      page_size: pageSize,
      total: count || 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error occurred.';
    console.error('Error in GET /api/v1/reviews/sessions:', err);
    return apiError('INTERNAL_SERVER_ERROR', message, 500);
  }
}
