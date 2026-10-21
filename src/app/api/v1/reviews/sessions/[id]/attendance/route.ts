import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

// PUT /api/v1/reviews/sessions/[id]/attendance - Update Review Session Attendance (HOD Only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['HOD']);
    const { id } = await params;
    const body = await request.json();

    const attendanceList = body.attendance;
    if (!Array.isArray(attendanceList)) {
      return apiError(
        'VALIDATION_ERROR',
        'attendance must be an array of attendance records.',
        400,
        { field: 'attendance' }
      );
    }

    const supabase = await createClient();

    // Resolve target UUID if code was passed
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

    const updatedItems = [];

    for (const item of attendanceList) {
      const studentId = item.student_id || item.studentId;
      const attended = Boolean(item.attended);
      const checkInTime = item.check_in_time || (attended ? new Date().toISOString() : null);

      if (studentId) {
        const { data: upserted, error: upsertErr } = await supabase
          .from('review_attendance')
          .upsert(
            {
              review_session_id: sessionUUID,
              student_id: studentId,
              attended,
              check_in_time: checkInTime,
            },
            { onConflict: 'review_session_id, student_id' }
          )
          .select()
          .single();

        if (upsertErr) {
          console.warn('Error updating attendance record for student:', studentId, upsertErr);
        } else if (upserted) {
          updatedItems.push({
            student_id: upserted.student_id,
            attended: upserted.attended,
            check_in_time: upserted.check_in_time,
          });
        }
      }
    }

    return apiSuccess({
      session_id: sessionUUID,
      attendance: updatedItems.length > 0 ? updatedItems : attendanceList.map((a: Record<string, unknown>) => ({
        student_id: a.student_id || a.studentId,
        attended: Boolean(a.attended),
        check_in_time: a.check_in_time,
      })),
      updated_count: updatedItems.length,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return apiError('FORBIDDEN', 'Access denied. HOD role required.', 403);
    }
    console.error('Error in PUT /api/v1/reviews/sessions/[id]/attendance:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred while updating attendance.', 500);
  }
}
