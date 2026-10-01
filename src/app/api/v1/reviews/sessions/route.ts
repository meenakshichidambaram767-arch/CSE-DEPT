import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

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

    const formattedSessions = (rawSessions || []).map((s: Record<string, unknown>) => {
      // Derive non-evaluative review title
      let title = `Weekly Review #${s.review_number}`;
      if (s.review_type === 'HACKATHON_POST') {
        title = 'Post-Hackathon Review';
      } else if (s.review_type === 'INTERNSHIP_MID') {
        title = 'Mid Internship Review';
      } else if (s.review_type === 'INTERNSHIP_FINAL') {
        title = 'Final Internship Review';
      }

      return {
        id: s.id as string,
        code: s.code as string,
        activityId: s.activity_id as string,
        activityTitle: (s.activities as Record<string, unknown>)?.title as string || '',
        activityType: (s.activities as Record<string, unknown>)?.type as string || 'PROJECT',
        reviewNumber: s.review_number as number,
        reviewType: (s.review_type as string) || 'PROJECT_WEEKLY',
        title,
        date: s.date as string,
        time: s.time as string,
        venue: s.venue as string,
        status: s.status as string,
        meetingNotes: s.meeting_notes as string | null,
        nextWeekGoal: s.next_week_goal as string | null,
        createdAt: s.created_at as string,
      };
    });

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
