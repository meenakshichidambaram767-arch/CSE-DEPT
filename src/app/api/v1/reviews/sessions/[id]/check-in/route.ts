import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

// POST /api/v1/reviews/sessions/[id]/check-in - Student QR Attendance Check-In
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireRole(['STUDENT']);
    const { id } = await params;
    const body = await request.json();
    const { qr_token } = body;

    if (!qr_token || !qr_token.trim()) {
      return apiError('VALIDATION_ERROR', 'qr_token is required for check-in.', 400, { field: 'qr_token' });
    }

    const supabase = await createClient();

    // Verify student profile
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id, name, register_number')
      .eq('user_id', authUser.id)
      .single();

    if (!studentRecord) {
      return apiError('STUDENT_PROFILE_NOT_FOUND', 'Student profile not found.', 403);
    }

    const studentId = studentRecord.id;

    // Fetch review session
    const { data: session, error: fetchErr } = await supabase
      .from('review_sessions')
      .select('*, activities!inner(*)')
      .or(`id.eq.${id},code.eq.${id}`)
      .single();

    if (fetchErr || !session) {
      return apiError('NOT_FOUND', 'Review session not found.', 404);
    }

    // Verify QR token match
    if (!session.qr_token || session.qr_token !== qr_token.trim()) {
      return apiError('INVALID_QR_TOKEN', 'The provided check-in QR token is invalid.', 400);
    }

    // Verify token expiry
    if (session.qr_expires_at && new Date() > new Date(session.qr_expires_at)) {
      return apiError('QR_EXPIRED', 'The check-in QR token has expired. Please ask HOD to refresh.', 400);
    }

    const nowIso = new Date().toISOString();

    // Record attendance (UPSERT)
    const { data: attRecord, error: attErr } = await supabase
      .from('review_attendance')
      .upsert(
        {
          review_session_id: session.id,
          student_id: studentId,
          attended: true,
          check_in_time: nowIso,
        },
        { onConflict: 'review_session_id,student_id' }
      )
      .select()
      .single();

    if (attErr) {
      console.error('Error recording attendance:', attErr);
      return apiError('DATABASE_ERROR', attErr.message, 500);
    }

    return apiSuccess({
      success: true,
      session_id: session.id,
      student_id: studentId,
      student_name: studentRecord?.name || authUser.name,
      register_number: studentRecord?.register_number || '',
      attended: attRecord.attended,
      check_in_time: attRecord.check_in_time,
      message: 'Attendance check-in verified successfully.',
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return apiError('FORBIDDEN', 'Access denied. Student role required.', 403);
    }
    console.error('Error in POST /api/v1/reviews/sessions/[id]/check-in:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
