import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

// GET /api/v1/od-requests/[id]/conflicts - Detect OD Schedule Conflicts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth();
    const { id } = await params;
    const supabase = await createClient();

    // Query target OD request
    const { data: od, error: fetchErr } = await supabase
      .from('od_requests')
      .select('*, students!inner(*)')
      .or(`id.eq.${id},code.eq.${id}`)
      .single();

    if (fetchErr || !od) {
      return apiError('NOT_FOUND', 'OD request not found.', 404);
    }

    // Query all existing APPROVED or PENDING OD requests for the same student (excluding current OD)
    const { data: otherODs } = await supabase
      .from('od_requests')
      .select('*, students(name, register_number)')
      .eq('student_id', od.student_id)
      .neq('id', od.id)
      .in('status', ['APPROVED', 'PENDING']);

    const targetStart = new Date(od.start_date).getTime();
    const targetEnd = new Date(od.end_date).getTime();

    const conflictingRequests: Record<string, unknown>[] = [];

    (otherODs || []).forEach((other: Record<string, unknown>) => {
      const otherStart = new Date(other.start_date as string).getTime();
      const otherEnd = new Date(other.end_date as string).getTime();

      // Check date range overlap: (startA <= endB) AND (endA >= startB)
      if (targetStart <= otherEnd && targetEnd >= otherStart) {
        conflictingRequests.push({
          id: other.id,
          code: other.code,
          eventName: other.event_name,
          purpose: other.purpose,
          startDate: other.start_date,
          endDate: other.end_date,
          status: other.status,
          conflictType: other.status === 'APPROVED' ? 'APPROVED_OVERLAP' : 'PENDING_OVERLAP',
        });
      }
    });

    const hasConflict = conflictingRequests.length > 0;

    return apiSuccess({
      odId: od.id,
      studentId: od.student_id,
      studentRegNo: od.students?.register_number,
      studentName: od.students?.name,
      hasConflict,
      conflictCount: conflictingRequests.length,
      conflictingRequests,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    console.error('Error in GET /api/v1/od-requests/[id]/conflicts:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
