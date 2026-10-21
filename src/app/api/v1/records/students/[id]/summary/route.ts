import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';
import {
  serializeStudentRecord,
  serializeODRequest,
  serializeActivity,
  serializeReviewSession,
} from '@/lib/api/serializers';

// GET /api/v1/records/students/[id]/summary - Detailed Student Summary for HOD Inspection
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['HOD']);
    const { id } = await params;
    const supabase = await createClient();

    // Query student profile by ID or register_number
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let studentQuery = supabase.from('students').select('*, users(email)');

    if (isUuid) {
      studentQuery = studentQuery.or(`id.eq.${id},user_id.eq.${id}`);
    } else {
      studentQuery = studentQuery.eq('register_number', id);
    }

    const { data: student, error: studentError } = await studentQuery.single();

    if (studentError || !student) {
      return apiError('NOT_FOUND', 'Student record not found.', 404);
    }

    // Query student's OD requests
    const { data: odRequests } = await supabase
      .from('od_requests')
      .select('*')
      .eq('student_id', student.id)
      .order('submitted_date', { ascending: false });

    // Query student's activities
    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false });

    // Calculate OD Statistics
    const allODs = odRequests || [];
    const approvedODs = allODs.filter((od) => od.status === 'APPROVED');
    const pendingODs = allODs.filter((od) => od.status === 'PENDING');
    const rejectedODs = allODs.filter((od) => od.status === 'REJECTED');
    const revisionODs = allODs.filter((od) => od.status === 'REVISION_REQUESTED');

    const totalApprovedDays = approvedODs.reduce((sum, od) => sum + (od.total_days || 1), 0);

    // Query student's review sessions via activities
    const activityIds = (activities || []).map((a) => a.id);
    let reviewSessions: any[] = [];
    if (activityIds.length > 0) {
      const { data: revs } = await supabase
        .from('review_sessions')
        .select('*, activities(title, type)')
        .in('activity_id', activityIds)
        .order('date', { ascending: false });
      reviewSessions = revs || [];
    }

    // Query attendance for attendance_rate
    const { data: attendanceData } = await supabase
      .from('review_attendance')
      .select('attended')
      .eq('student_id', student.id);

    const totalAttendanceMarked = (attendanceData || []).length;
    const attendedCount = (attendanceData || []).filter((a) => a.attended).length;
    const attendanceRate = totalAttendanceMarked > 0 ? Math.round((attendedCount / totalAttendanceMarked) * 100) : 100;

    const serializedODs = allODs.map((od) => serializeODRequest(od));
    const serializedActivities = (activities || []).map((act) => serializeActivity(act));
    const serializedReviews = reviewSessions.map((rev) => serializeReviewSession(rev));

    const payload = {
      student: serializeStudentRecord(student),
      stats: {
        total_ods: allODs.length,
        approved_ods: approvedODs.length,
        pending_ods: pendingODs.length,
        rejected_ods: rejectedODs.length,
        revision_ods: revisionODs.length,
        total_approved_days: totalApprovedDays,
        total_activities: (activities || []).length,
        active_activities: (activities || []).filter(
          (a) => a.status === 'ACTIVE' || a.status === 'APPROVED'
        ).length,
        total_reviews: reviewSessions.length,
        attendance_rate: attendanceRate,
      },
      recent_ods: serializedODs,
      od_clearances: serializedODs,
      activities: serializedActivities,
      reviews: serializedReviews,
    };

    return apiSuccess(payload);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return apiError('FORBIDDEN', 'HOD authorization required.', 403);
    }
    console.error('Error in GET /api/v1/records/students/[id]/summary:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
