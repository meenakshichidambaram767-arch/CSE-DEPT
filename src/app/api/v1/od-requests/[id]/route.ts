import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

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

    // Query OD request record
    const { data: od, error } = await supabase
      .from('od_requests')
      .select('*, students!inner(*)')
      .or(`id.eq.${id},code.eq.${id}`)
      .single();

    if (error || !od) {
      return apiError('NOT_FOUND', 'OD request not found.', 404);
    }

    // Ownership & Authorization check
    if (authUser.role === 'STUDENT') {
      const { data: studentRecord } = await supabase
        .from('students')
        .select('id, register_number')
        .eq('user_id', authUser.id)
        .single();

      const isOwner = studentRecord && od.student_id === studentRecord.id;

      // Check if student is in team_members
      let isTeamMember = false;
      if (!isOwner && studentRecord) {
        const { data: tm } = await supabase
          .from('od_team_members')
          .select('id')
          .eq('od_request_id', od.id)
          .eq('register_number', studentRecord.register_number)
          .maybeSingle();
        if (tm) isTeamMember = true;
      }

      if (!isOwner && !isTeamMember) {
        return apiError('FORBIDDEN', 'You are not authorized to view this request.', 403);
      }
    }

    // Query Team Members
    const { data: teamMembers } = await supabase
      .from('od_team_members')
      .select('*')
      .eq('od_request_id', od.id);

    // Query Documents
    const { data: docs } = await supabase
      .from('documents')
      .select('*')
      .eq('owner', 'od_request')
      .eq('owner_id', od.id);

    // Query Status History
    const { data: history } = await supabase
      .from('od_status_history')
      .select('*, users(name)')
      .eq('od_request_id', od.id)
      .order('changed_at', { ascending: true });

    const formattedHistory = (history || []).map((h: any) => ({
      id: h.id,
      oldStatus: h.old_status,
      newStatus: h.new_status,
      note: h.note,
      changedBy: h.users?.name || 'System',
      changedAt: h.changed_at,
    }));

    const responsePayload = {
      id: od.id,
      code: od.code,
      studentId: od.student_id,
      studentName: od.students?.name || '',
      studentRegNo: od.students?.register_number || '',
      department: od.students?.department || 'CSE',
      year: od.students?.year || 'II',
      section: od.students?.section || 'A',
      eventId: od.event_id,
      activityId: od.activity_id,
      purpose: od.purpose,
      eventName: od.event_name,
      organization: od.organization,
      reason: od.reason,
      startDate: od.start_date,
      endDate: od.end_date,
      date: od.start_date,
      fromTime: od.from_time,
      toTime: od.to_time,
      slotType: od.slot_type,
      totalDays: od.total_days,
      venue: od.venue,
      registrationId: od.registration_id,
      additionalNotes: od.additional_notes,
      status: od.status,
      remarks: od.remarks,
      rejectionReason: od.rejection_reason,
      revisionNotes: od.revision_notes,
      submittedDate: od.submitted_date,
      approvedDate: od.approved_date,
      teamMembers: (teamMembers || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        regNo: m.register_number,
        email: m.email,
        role: m.role,
      })),
      documents: (docs || []).map((d: any) => ({
        id: d.id,
        name: d.file_name,
        type: d.document_type,
        size: `${Math.round(d.size / 1024)} KB`,
        uploadDate: d.created_at,
        path: d.storage_path,
      })),
      statusHistory: formattedHistory,
    };

    return apiSuccess(responsePayload);
  } catch (err: any) {
    console.error('Error in GET /api/v1/od-requests/[id]:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
