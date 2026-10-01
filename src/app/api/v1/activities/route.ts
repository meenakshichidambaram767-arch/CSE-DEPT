import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, requireAuth } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

// GET /api/v1/activities - List Activities (Projects, Hackathons, Internships)
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const year = searchParams.get('year');
    const section = searchParams.get('section');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('page_size') || '20', 10);

    const supabase = await createClient();

    let query = supabase
      .from('activities')
      .select('*, students!inner(*)', { count: 'exact' });

    // Role-based filtering
    if (authUser.role === 'STUDENT') {
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
      if (type && type !== 'ALL') {
        query = query.eq('type', type);
      }
      if (status && status !== 'ALL') {
        query = query.eq('status', status);
      }
      if (year && year !== 'ALL') {
        query = query.eq('students.year', year);
      }
      if (section && section !== 'ALL') {
        query = query.eq('students.section', section);
      }
      if (search && search.trim() !== '') {
        const q = `%${search.trim()}%`;
        query = query.or(
          `title.ilike.${q},description.ilike.${q},code.ilike.${q},students.name.ilike.${q},students.register_number.ilike.${q}`
        );
      }
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: rawData, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error querying activities:', error);
      return apiError('QUERY_ERROR', error.message, 500);
    }

    const formattedData = (rawData || []).map((row: Record<string, any>) => ({
      id: row.id,
      code: row.code,
      studentId: row.student_id,
      studentName: row.students?.name || '',
      studentRegNo: row.students?.register_number || '',
      department: row.students?.department || 'CSE',
      year: row.students?.year || 'II',
      section: row.students?.section || 'A',
      type: row.type,
      title: row.title,
      description: row.description,
      technologies: row.technologies || [],
      startDate: row.start_date,
      endDate: row.end_date,
      organization: row.organization,
      companyName: row.company_name,
      githubUrl: row.github_url,
      demoUrl: row.demo_url,
      status: row.status,
      rejectionReason: row.rejection_reason,
      revisionNotes: row.revision_notes,
      odStatus: row.od_status,
      reviewCount: row.review_count || 0,
      guideName: row.guide_name,
      createdAt: row.created_at,
    }));

    return apiSuccess(formattedData, 200, {
      page,
      page_size: pageSize,
      total: count || 0,
    });
  } catch (err: unknown) {
    console.error('Error in GET /api/v1/activities:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}

// POST /api/v1/activities - Submit Activity Proposal (Student Only)
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const supabase = await createClient();

    // Verify student profile
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id, name, register_number, email')
      .eq('user_id', authUser.id)
      .single();

    if (!studentRecord && authUser.role === 'STUDENT') {
      return apiError(
        'STUDENT_PROFILE_NOT_FOUND',
        'Student profile not found for authenticated user.',
        400
      );
    }

    const body = await request.json();

    const {
      type,
      title,
      description,
      technologies = [],
      start_date,
      end_date,
      organization,
      company_name,
      github_url,
      demo_url,
      guide_name,
      team_members = [],
    } = body;

    // Validation constraints
    const allowedTypes = ['PROJECT', 'INTERNSHIP', 'HACKATHON'];
    if (!type || !allowedTypes.includes(type)) {
      return apiError(
        'VALIDATION_ERROR',
        `Activity type must be one of: ${allowedTypes.join(', ')}`,
        400,
        { field: 'type' }
      );
    }
    if (!title || !title.trim()) {
      return apiError('VALIDATION_ERROR', 'Activity title is required.', 400, { field: 'title' });
    }
    if (!description || !description.trim()) {
      return apiError('VALIDATION_ERROR', 'Description is required.', 400, { field: 'description' });
    }
    if (!start_date) {
      return apiError('VALIDATION_ERROR', 'Start date is required.', 400, { field: 'start_date' });
    }

    // Team Member Validation against Database Students
    const validatedTeamMembers: Array<{ name: string; register_number: string; email: string; role: string }> = [];
    if (Array.isArray(team_members) && team_members.length > 0) {
      const regNos = team_members.map((tm: { register_number?: string; regNo?: string }) => (tm.register_number || tm.regNo || '').trim()).filter(Boolean);
      
      // Duplicate register number check in submission
      const uniqueRegNos = new Set(regNos);
      if (uniqueRegNos.size !== regNos.length) {
        return apiError('VALIDATION_ERROR', 'Duplicate team member register numbers are not allowed.', 400);
      }

      // Verify each register_number exists in real students database table
      const { data: dbStudents } = await supabase
        .from('students')
        .select('id, name, register_number, email')
        .in('register_number', Array.from(uniqueRegNos));

      const foundRegMap = new Map((dbStudents || []).map((s) => [s.register_number, s]));

      for (const tm of team_members) {
        const rNo = (tm.register_number || tm.regNo || '').trim();
        if (!foundRegMap.has(rNo)) {
          return apiError(
            'STUDENT_NOT_FOUND',
            `Team member with register number '${rNo}' is not a registered student.`,
            400,
            { register_number: rNo }
          );
        }
        const matched = foundRegMap.get(rNo)!;
        validatedTeamMembers.push({
          name: matched.name,
          register_number: matched.register_number,
          email: matched.email || tm.email || '',
          role: tm.role || 'MEMBER',
        });
      }
    }

    // Auto-generate code prefix (PRJ / HAK / INT)
    const prefix = type === 'PROJECT' ? 'PRJ' : type === 'HACKATHON' ? 'HAK' : 'INT';
    const { count } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true });
    
    const activityCode = `${prefix}-2026-${String((count || 0) + 1).padStart(3, '0')}`;

    // Insert Activity Record
    const { data: newActivity, error: insertError } = await supabase
      .from('activities')
      .insert({
        code: activityCode,
        student_id: studentRecord?.id || authUser.id,
        type,
        title: title.trim(),
        description: description.trim(),
        technologies: Array.isArray(technologies) ? technologies : [technologies],
        start_date,
        end_date: end_date || start_date,
        organization: organization ? organization.trim() : null,
        company_name: company_name ? company_name.trim() : null,
        github_url: github_url ? github_url.trim() : null,
        demo_url: demo_url ? demo_url.trim() : null,
        guide_name: guide_name ? guide_name.trim() : null,
        status: 'SUBMITTED',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting activity:', insertError);
      return apiError('DATABASE_ERROR', insertError.message, 500);
    }

    // Insert Validated Team Members
    if (validatedTeamMembers.length > 0) {
      const tmRows = validatedTeamMembers.map((tm) => ({
        activity_id: newActivity.id,
        name: tm.name,
        register_number: tm.register_number,
        email: tm.email,
        role: tm.role,
      }));
      await supabase.from('activity_team_members').insert(tmRows);
    }

    // Record Status History
    await supabase.from('activity_status_history').insert({
      activity_id: newActivity.id,
      old_status: 'NONE',
      new_status: 'SUBMITTED',
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
        title: `New ${type} Proposal: ${newActivity.title}`,
        message: `${studentRecord?.name || authUser.name} submitted a new ${type.toLowerCase()} proposal.`,
        type: 'SUBMISSION_UPDATE',
        is_read: false,
        link_url: `/hod/approvals/${newActivity.id}`,
      });
    }

    return apiSuccess({
      id: newActivity.id,
      code: newActivity.code,
      studentId: newActivity.student_id,
      type: newActivity.type,
      title: newActivity.title,
      status: newActivity.status,
      createdAt: newActivity.created_at,
    }, 201);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    console.error('Error in POST /api/v1/activities:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
