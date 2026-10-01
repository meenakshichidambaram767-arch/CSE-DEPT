import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, requireAuth } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

// GET /api/v1/od-requests - Paginated & Filtered List
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const year = searchParams.get('year');
    const section = searchParams.get('section');
    const purpose = searchParams.get('purpose');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('page_size') || '20', 10);

    const supabase = await createClient();

    let query = supabase
      .from('od_requests')
      .select('*, students!inner(*)', { count: 'exact' });

    // Role-based filtering
    if (authUser.role === 'STUDENT') {
      // Students see only their own requests
      const { data: studentRecord } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', authUser.id)
        .single();

      if (!studentRecord) {
        return apiSuccess([], 200, { page, page_size: pageSize, total: 0 });
      }
      query = query.eq('student_id', studentRecord.id);
    } else if (authUser.role === 'HOD') {
      // HOD filtering
      if (status && status !== 'ALL') {
        query = query.eq('status', status);
      }
      if (year && year !== 'ALL') {
        query = query.eq('students.year', year);
      }
      if (section && section !== 'ALL') {
        query = query.eq('students.section', section);
      }
      if (purpose && purpose !== 'ALL') {
        query = query.eq('purpose', purpose);
      }
      if (search && search.trim() !== '') {
        const q = `%${search.trim()}%`;
        query = query.or(
          `event_name.ilike.${q},venue.ilike.${q},students.name.ilike.${q},students.register_number.ilike.${q}`
        );
      }
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: rawData, count, error } = await query
      .order('submitted_date', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error querying od_requests:', error);
      return apiError('QUERY_ERROR', error.message, 500);
    }

    // Format data to match API contract
    const formattedData = (rawData || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      code: row.code as string,
      studentId: row.student_id as string,
      studentName: (row.students as Record<string, unknown>)?.name as string || 'Student',
      studentRegNo: (row.students as Record<string, unknown>)?.register_number as string || '',
      department: (row.students as Record<string, unknown>)?.department as string || 'CSE',
      year: (row.students as Record<string, unknown>)?.year as string || 'II',
      section: (row.students as Record<string, unknown>)?.section as string || 'A',
      eventId: row.event_id as string | null,
      activityId: row.activity_id as string | null,
      purpose: row.purpose as string,
      eventName: row.event_name as string,
      organization: row.organization as string | null,
      reason: row.reason as string,
      startDate: row.start_date as string,
      endDate: row.end_date as string,
      date: row.start_date as string,
      fromTime: row.from_time as string | null,
      toTime: row.to_time as string | null,
      slotType: row.slot_type as string | null,
      totalDays: row.total_days as number,
      venue: row.venue as string,
      registrationId: row.registration_id as string | null,
      additionalNotes: row.additional_notes as string | null,
      status: row.status as string,
      remarks: row.remarks as string | null,
      rejectionReason: row.rejection_reason as string | null,
      revisionNotes: row.revision_notes as string | null,
      submittedDate: row.submitted_date as string,
      approvedDate: row.approved_date as string | null,
    }));

    return apiSuccess(formattedData, 200, {
      page,
      page_size: pageSize,
      total: count || 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error occurred.';
    console.error('Error in GET /api/v1/od-requests:', err);
    return apiError('INTERNAL_SERVER_ERROR', message, 500);
  }
}

// POST /api/v1/od-requests - Submit OD Request
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const supabase = await createClient();

    // Verify student profile
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id, name, register_number, department, year, section')
      .eq('user_id', authUser.id)
      .single();

    const studentId = studentRecord ? studentRecord.id : null;

    if (!studentId && authUser.role === 'STUDENT') {
      return apiError(
        'STUDENT_PROFILE_NOT_FOUND',
        'No student profile found for authenticated user.',
        400
      );
    }

    const body = await request.json();

    const {
      event_id,
      activity_id,
      purpose,
      event_name,
      organization,
      reason,
      start_date,
      end_date,
      from_time,
      to_time,
      slot_type,
      total_days = 1,
      venue,
      registration_id,
      company_name,
      company_role,
      company_location,
      additional_notes,
      team_members = [],
    } = body;

    // Validation constraints
    if (!purpose) {
      return apiError('VALIDATION_ERROR', 'Purpose is required.', 400, { field: 'purpose' });
    }
    if (!event_name) {
      return apiError('VALIDATION_ERROR', 'Event name is required.', 400, { field: 'event_name' });
    }
    if (!reason) {
      return apiError('VALIDATION_ERROR', 'Reason is required.', 400, { field: 'reason' });
    }
    if (!start_date) {
      return apiError('VALIDATION_ERROR', 'Start date is required.', 400, { field: 'start_date' });
    }

    // Generate display code OD-2026-NNN
    const { count } = await supabase
      .from('od_requests')
      .select('*', { count: 'exact', head: true });
    
    const odCode = `OD-2026-${String((count || 0) + 1).padStart(3, '0')}`;

    // Insert OD Request
    const { data: newOD, error: insertError } = await supabase
      .from('od_requests')
      .insert({
        code: odCode,
        student_id: studentId || authUser.id,
        event_id: event_id || null,
        activity_id: activity_id || null,
        purpose,
        event_name,
        organization: organization || null,
        reason,
        start_date,
        end_date: end_date || start_date,
        from_time: from_time || null,
        to_time: to_time || null,
        slot_type: slot_type || null,
        total_days,
        venue: venue || 'CSE Department',
        registration_id: registration_id || null,
        company_name: company_name || null,
        company_role: company_role || null,
        company_location: company_location || null,
        additional_notes: additional_notes || null,
        status: 'PENDING',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting od_request:', insertError);
      return apiError('DATABASE_ERROR', insertError.message, 500);
    }

    // Insert Team Members if provided
    if (Array.isArray(team_members) && team_members.length > 0) {
      const tmRows = team_members.map((tm: { name: string; register_number?: string; regNo?: string; email?: string; role?: string }) => ({
        od_request_id: newOD.id,
        name: tm.name,
        register_number: tm.register_number || tm.regNo,
        email: tm.email || '',
        role: tm.role || 'MEMBER',
      }));
      await supabase.from('od_team_members').insert(tmRows);
    }

    // Record Status History
    await supabase.from('od_status_history').insert({
      od_request_id: newOD.id,
      old_status: 'NONE',
      new_status: 'PENDING',
      note: 'Submitted by student',
      changed_by: authUser.id,
    });

    // Notify HOD
    const { data: hodUserRecord } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'HOD')
      .limit(1)
      .single();

    if (hodUserRecord) {
      await supabase.from('notifications').insert({
        user_id: hodUserRecord.id,
        title: `New OD Request: ${newOD.event_name}`,
        message: `${studentRecord?.name || authUser.name} requested OD for "${newOD.event_name}" on ${newOD.start_date}.`,
        type: 'OD_UPDATE',
        is_read: false,
        link_url: `/hod/requests/${newOD.id}`,
      });
    }

    return apiSuccess({
      id: newOD.id,
      code: newOD.code,
      studentId: newOD.student_id,
      studentName: studentRecord?.name || authUser.name,
      studentRegNo: studentRecord?.register_number || '',
      purpose: newOD.purpose,
      eventName: newOD.event_name,
      reason: newOD.reason,
      startDate: newOD.start_date,
      endDate: newOD.end_date,
      status: newOD.status,
      submittedDate: newOD.submitted_date,
    }, 201);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    console.error('Error in POST /api/v1/od-requests:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
