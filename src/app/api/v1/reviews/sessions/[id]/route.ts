import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';
import { serializeReviewSession } from '@/lib/api/serializers';

// GET /api/v1/reviews/sessions/[id] - Single Review Session Detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const { id } = await params;
    const supabase = await createClient();

    // Query session
    const { data: session, error: fetchErr } = await supabase
      .from('review_sessions')
      .select('*, activities!inner(*)')
      .or(`id.eq.${id},code.eq.${id}`)
      .single();

    if (fetchErr || !session) {
      return apiError('NOT_FOUND', 'Review session not found.', 404);
    }

    // Ownership & Authorization check for students
    if (authUser.role === 'STUDENT') {
      const { data: studentRecord } = await supabase
        .from('students')
        .select('id, register_number')
        .eq('user_id', authUser.id)
        .single();

      const isOwner = studentRecord && session.activities.student_id === studentRecord.id;

      let isTeamMember = false;
      if (!isOwner && studentRecord) {
        const { data: tm } = await supabase
          .from('activity_team_members')
          .select('id')
          .eq('activity_id', session.activity_id)
          .eq('register_number', studentRecord.register_number)
          .maybeSingle();
        if (tm) isTeamMember = true;
      }

      if (!isOwner && !isTeamMember) {
        return apiError('FORBIDDEN', 'You are not authorized to view this review session.', 403);
      }
    }

    // Query Progress Submissions
    const { data: progressList } = await supabase
      .from('weekly_progress')
      .select('*, students(name, register_number)')
      .eq('review_session_id', session.id);

    // Query Attendance
    const { data: attendanceList } = await supabase
      .from('review_attendance')
      .select('*, students(name, register_number)')
      .eq('review_session_id', session.id);

    const responsePayload = serializeReviewSession(session, {
      attendance: attendanceList || [],
      progress: progressList || [],
    });

    if (authUser.role !== 'HOD') {
      delete (responsePayload as Record<string, unknown>).qr_token;
      delete (responsePayload as Record<string, unknown>).qr_code_token;
      delete (responsePayload as Record<string, unknown>).qr_expires_at;
    }

    return apiSuccess(responsePayload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error occurred.';
    console.error('Error in GET /api/v1/reviews/sessions/[id]:', err);
    return apiError('INTERNAL_SERVER_ERROR', message, 500);
  }
}
