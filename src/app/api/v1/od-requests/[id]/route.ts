import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';
import { serializeODRequest } from '@/lib/api/serializers';

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

    const formattedHistory = (history || []).map((h: Record<string, unknown>) => ({
      id: h.id as string,
      oldStatus: h.old_status as string,
      newStatus: h.new_status as string,
      note: h.note as string | null,
      changedBy: (h.users as Record<string, unknown>)?.name as string || 'System',
      changedAt: h.changed_at as string,
    }));

    // Query OD Conflict Overlaps
    const { data: conflictingODs } = await supabase
      .from('od_requests')
      .select('id, code, event_name, purpose, start_date, end_date, status')
      .eq('student_id', od.student_id)
      .neq('id', od.id)
      .in('status', ['APPROVED', 'PENDING']);

    const targetStart = new Date(od.start_date).getTime();
    const targetEnd = new Date(od.end_date).getTime();
    const conflicts: Record<string, unknown>[] = [];

    (conflictingODs || []).forEach((other: Record<string, unknown>) => {
      const oStart = new Date(other.start_date as string).getTime();
      const oEnd = new Date(other.end_date as string).getTime();
      if (targetStart <= oEnd && targetEnd >= oStart) {
        conflicts.push({
          id: other.id,
          code: other.code,
          event_name: other.event_name,
          purpose: other.purpose,
          start_date: other.start_date,
          end_date: other.end_date,
          status: other.status,
        });
      }
    });

    const responsePayload = serializeODRequest(od, {
      team_members: teamMembers || [],
      documents: docs || [],
      status_history: history || [],
      conflicts,
    });

    return apiSuccess(responsePayload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error occurred.';
    console.error('Error in GET /api/v1/od-requests/[id]:', err);
    return apiError('INTERNAL_SERVER_ERROR', message, 500);
  }
}
