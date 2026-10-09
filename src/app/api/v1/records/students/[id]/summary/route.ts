import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

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

    const formattedODs = allODs.map((od) => ({
      id: od.id,
      code: od.code,
      purpose: od.purpose,
      eventName: od.event_name,
      startDate: od.start_date,
      endDate: od.end_date,
      totalDays: od.total_days,
      status: od.status,
      submittedDate: od.submitted_date,
    }));

    const formattedActivities = (activities || []).map((act) => ({
      id: act.id,
      code: act.code,
      type: act.type,
      title: act.title,
      status: act.status,
      startDate: act.start_date,
      endDate: act.end_date,
    }));

    const payload = {
      student: {
        id: student.id,
        userId: student.user_id,
        registerNumber: student.register_number,
        regNo: student.register_number,
        name: student.name,
        department: student.department || 'CSE',
        year: student.year,
        section: student.section,
        email: student.email || student.users?.email || '',
      },
      stats: {
        totalRequests: allODs.length,
        approvedRequests: approvedODs.length,
        pendingRequests: pendingODs.length,
        rejectedRequests: rejectedODs.length,
        revisionRequests: revisionODs.length,
        totalApprovedDays,
        totalActivities: (activities || []).length,
      },
      odRequests: formattedODs,
      activities: formattedActivities,
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
