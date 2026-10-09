import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

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

    // Derive title
    let title = `Weekly Review #${session.review_number}`;
    if (session.review_type === 'HACKATHON_POST') {
      title = 'Post-Hackathon Review';
    } else if (session.review_type === 'INTERNSHIP_MID') {
      title = 'Mid Internship Review';
    } else if (session.review_type === 'INTERNSHIP_FINAL') {
      title = 'Final Internship Review';
    }

    const formattedProgress = (progressList || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      studentId: p.student_id as string,
      studentName: (p.students as Record<string, unknown>)?.name as string || '',
      studentRegNo: (p.students as Record<string, unknown>)?.register_number as string || '',
      completedWork: p.completed_this_week as string,
      currentWork: p.currently_working_on as string,
      nextSteps: p.next_week_goal as string,
      blockers: p.blockers as string,
      githubUrl: p.githubUrl as string | null,
      submittedAt: p.submitted_at as string,
    }));

    const formattedAttendance = (attendanceList || []).map((a: Record<string, unknown>) => ({
      id: a.id as string,
      studentId: a.student_id as string,
      studentName: (a.students as Record<string, unknown>)?.name as string || '',
      studentRegNo: (a.students as Record<string, unknown>)?.register_number as string || '',
      attended: a.attended as boolean,
      checkInTime: a.check_in_time as string,
    }));

    return apiSuccess({
      id: session.id,
      code: session.code,
      activityId: session.activity_id,
      activityTitle: session.activities.title,
      activityType: session.activities.type,
      reviewNumber: session.review_number,
      reviewType: session.review_type || 'PROJECT_WEEKLY',
      title,
      date: session.date,
      time: session.time,
      venue: session.venue,
      status: session.status,
      meetingNotes: session.meeting_notes,
      nextWeekGoal: session.next_week_goal,
      qrToken: authUser.role === 'HOD' ? session.qr_token : undefined,
      qrExpiresAt: authUser.role === 'HOD' ? session.qr_expires_at : undefined,
      progressReports: formattedProgress,
      attendance: formattedAttendance,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error occurred.';
    console.error('Error in GET /api/v1/reviews/sessions/[id]:', err);
    return apiError('INTERNAL_SERVER_ERROR', message, 500);
  }
}
