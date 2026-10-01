import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

// GET /api/v1/activities/[id] - Single Activity Detail
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

    // Query activity record
    const { data: act, error } = await supabase
      .from('activities')
      .select('*, students!inner(*)')
      .or(`id.eq.${id},code.eq.${id}`)
      .single();

    if (error || !act) {
      return apiError('NOT_FOUND', 'Activity record not found.', 404);
    }

    // Ownership & Authorization check
    if (authUser.role === 'STUDENT') {
      const { data: studentRecord } = await supabase
        .from('students')
        .select('id, register_number')
        .eq('user_id', authUser.id)
        .single();

      const isOwner = studentRecord && act.student_id === studentRecord.id;

      let isTeamMember = false;
      if (!isOwner && studentRecord) {
        const { data: tm } = await supabase
          .from('activity_team_members')
          .select('id')
          .eq('activity_id', act.id)
          .eq('register_number', studentRecord.register_number)
          .maybeSingle();
        if (tm) isTeamMember = true;
      }

      if (!isOwner && !isTeamMember) {
        return apiError('FORBIDDEN', 'You are not authorized to view this activity.', 403);
      }
    }

    // Query Team Members
    const { data: teamMembers } = await supabase
      .from('activity_team_members')
      .select('*')
      .eq('activity_id', act.id);

    // Query Documents
    const { data: docs } = await supabase
      .from('documents')
      .select('*')
      .eq('owner', 'activity')
      .eq('owner_id', act.id);

    // Query Status History
    const { data: history } = await supabase
      .from('activity_status_history')
      .select('*, users(name)')
      .eq('activity_id', act.id)
      .order('changed_at', { ascending: true });

    const formattedHistory = (history || []).map((h: Record<string, unknown>) => ({
      id: h.id as string,
      oldStatus: h.old_status as string,
      newStatus: h.new_status as string,
      note: h.note as string | null,
      changedBy: (h.users as Record<string, unknown>)?.name as string || 'System',
      changedAt: h.changed_at as string,
    }));

    const responsePayload = {
      id: act.id,
      code: act.code,
      studentId: act.student_id,
      studentName: act.students?.name || '',
      studentRegNo: act.students?.register_number || '',
      department: act.students?.department || 'CSE',
      year: act.students?.year || 'II',
      section: act.students?.section || 'A',
      type: act.type,
      title: act.title,
      description: act.description,
      technologies: act.technologies || [],
      startDate: act.start_date,
      endDate: act.end_date,
      organization: act.organization,
      companyName: act.company_name,
      githubUrl: act.github_url,
      demoUrl: act.demo_url,
      status: act.status,
      rejectionReason: act.rejection_reason,
      revisionNotes: act.revision_notes,
      odStatus: act.od_status,
      reviewCount: act.review_count || 0,
      guideName: act.guide_name,
      createdAt: act.created_at,
      updatedAt: act.updated_at,
      teamMembers: (teamMembers || []).map((m: Record<string, unknown>) => ({
        id: m.id as string,
        name: m.name as string,
        regNo: m.register_number as string,
        email: m.email as string,
        role: m.role as string,
      })),
      documents: (docs || []).map((d: Record<string, unknown>) => ({
        id: d.id as string,
        name: d.file_name as string,
        type: d.document_type as string,
        size: `${Math.round((d.size as number) / 1024)} KB`,
        uploadDate: d.created_at as string,
        path: d.storage_path as string,
      })),
      statusHistory: formattedHistory,
    };

    return apiSuccess(responsePayload);
  } catch (err: unknown) {
    console.error('Error in GET /api/v1/activities/[id]:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
