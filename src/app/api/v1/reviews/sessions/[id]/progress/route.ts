import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

// POST /api/v1/reviews/sessions/[id]/progress - Student Progress Report Submission
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const {
      completed_this_week,
      currently_working_on,
      next_week_goal,
      blockers,
      github_url,
      githubUrl,
    } = body;

    if (!completed_this_week || !currently_working_on || !next_week_goal || !blockers) {
      return apiError(
        'VALIDATION_ERROR',
        'completed_this_week, currently_working_on, next_week_goal, and blockers are required.',
        400
      );
    }

    const supabase = await createClient();

    // Verify student profile
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id, name')
      .eq('user_id', authUser.id)
      .single();

    if (!studentRecord && authUser.role === 'STUDENT') {
      return apiError('STUDENT_PROFILE_NOT_FOUND', 'Student profile not found.', 400);
    }

    const studentId = studentRecord ? studentRecord.id : authUser.id;

    // Fetch review session
    const { data: session, error: fetchErr } = await supabase
      .from('review_sessions')
      .select('id')
      .or(`id.eq.${id},code.eq.${id}`)
      .single();

    if (fetchErr || !session) {
      return apiError('NOT_FOUND', 'Review session not found.', 404);
    }

    const nowIso = new Date().toISOString();

    // Upsert 4-quadrant progress log
    const { data: progressRecord, error: progErr } = await supabase
      .from('weekly_progress')
      .upsert(
        {
          review_session_id: session.id,
          student_id: studentId,
          completed_this_week: completed_this_week.trim(),
          currently_working_on: currently_working_on.trim(),
          next_week_goal: next_week_goal.trim(),
          blockers: blockers.trim(),
          githubUrl: github_url || githubUrl || null,
          submitted_at: nowIso,
        },
        { onConflict: 'review_session_id,student_id' }
      )
      .select()
      .single();

    if (progErr) {
      console.error('Error submitting progress report:', progErr);
      return apiError('DATABASE_ERROR', progErr.message, 500);
    }

    return apiSuccess({
      id: progressRecord.id,
      reviewSessionId: session.id,
      studentId,
      completedWork: progressRecord.completed_this_week,
      currentWork: progressRecord.currently_working_on,
      nextSteps: progressRecord.next_week_goal,
      blockers: progressRecord.blockers,
      githubUrl: progressRecord.githubUrl,
      submittedAt: progressRecord.submitted_at,
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    console.error('Error in POST /api/v1/reviews/sessions/[id]/progress:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
