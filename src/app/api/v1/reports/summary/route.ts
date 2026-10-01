import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

// GET /api/v1/reports/summary - Department Dashboard & Summary Analytics (HOD Only)
export async function GET(request: NextRequest) {
  try {
    await requireRole(['HOD']);
    const { searchParams } = new URL(request.url);

    const year = searchParams.get('year');
    const section = searchParams.get('section');

    const supabase = await createClient();

    // 1. Query Students Summary
    let studentQuery = supabase.from('students').select('id, year, section');
    if (year && year !== 'ALL') studentQuery = studentQuery.eq('year', year);
    if (section && section !== 'ALL') studentQuery = studentQuery.eq('section', section);

    const { data: students, error: studErr } = await studentQuery;
    if (studErr) {
      console.error('Error fetching students count:', studErr);
      return apiError('DATABASE_ERROR', studErr.message, 500);
    }

    const totalStudents = students?.length || 0;
    const studentsByYear = {
      I: students?.filter((s) => s.year === 'I').length || 0,
      II: students?.filter((s) => s.year === 'II').length || 0,
      III: students?.filter((s) => s.year === 'III').length || 0,
      IV: students?.filter((s) => s.year === 'IV').length || 0,
    };
    const studentsBySection = {
      A: students?.filter((s) => s.section === 'A').length || 0,
      B: students?.filter((s) => s.section === 'B').length || 0,
      C: students?.filter((s) => s.section === 'C').length || 0,
      D: students?.filter((s) => s.section === 'D').length || 0,
      E: students?.filter((s) => s.section === 'E').length || 0,
    };

    // 2. Query OD Requests Summary
    const { data: odRequests, error: odErr } = await supabase
      .from('od_requests')
      .select('id, status, total_days');

    if (odErr) {
      console.error('Error fetching OD requests:', odErr);
      return apiError('DATABASE_ERROR', odErr.message, 500);
    }

    const allODs = odRequests || [];
    const odSummary = {
      total: allODs.length,
      pending: allODs.filter((o) => o.status === 'PENDING').length,
      approved: allODs.filter((o) => o.status === 'APPROVED').length,
      rejected: allODs.filter((o) => o.status === 'REJECTED').length,
      revisionRequested: allODs.filter((o) => o.status === 'REVISION_REQUESTED').length,
      totalApprovedDays: allODs
        .filter((o) => o.status === 'APPROVED')
        .reduce((sum, o) => sum + (o.total_days || 1), 0),
    };

    // 3. Query Activities Summary
    const { data: activities, error: actErr } = await supabase
      .from('activities')
      .select('id, type, status');

    if (actErr) {
      console.error('Error fetching activities:', actErr);
      return apiError('DATABASE_ERROR', actErr.message, 500);
    }

    const allActs = activities || [];
    const activitySummary = {
      total: allActs.length,
      projects: allActs.filter((a) => a.type === 'PROJECT').length,
      hackathons: allActs.filter((a) => a.type === 'HACKATHON').length,
      internships: allActs.filter((a) => a.type === 'INTERNSHIP').length,
      statusBreakdown: {
        submitted: allActs.filter((a) => a.status === 'SUBMITTED').length,
        active: allActs.filter((a) => a.status === 'ACTIVE' || a.status === 'APPROVED').length,
        rejected: allActs.filter((a) => a.status === 'REJECTED').length,
        revisionRequested: allActs.filter((a) => a.status === 'REVISION_REQUESTED').length,
        completed: allActs.filter((a) => a.status === 'COMPLETED').length,
      },
    };

    // 4. Query Review Sessions Summary
    const { data: reviewSessions } = await supabase
      .from('review_sessions')
      .select('id, status');

    const { data: attendanceList } = await supabase
      .from('review_attendance')
      .select('id, attended')
      .eq('attended', true);

    const allReviews = reviewSessions || [];
    const reviewSummary = {
      total: allReviews.length,
      scheduled: allReviews.filter((r) => r.status === 'SCHEDULED').length,
      completed: allReviews.filter((r) => r.status === 'COMPLETED').length,
      totalAttendedCount: (attendanceList || []).length,
    };

    // 5. Query Events Summary
    const { data: events } = await supabase
      .from('events')
      .select('id, status');

    const allEvents = events || [];
    const eventSummary = {
      total: allEvents.length,
      upcoming: allEvents.filter((e) => e.status === 'UPCOMING').length,
      ongoing: allEvents.filter((e) => e.status === 'ONGOING').length,
      completed: allEvents.filter((e) => e.status === 'COMPLETED').length,
    };

    return apiSuccess({
      department: 'Computer Science and Engineering',
      academicYear: '2026-2027',
      students: {
        total: totalStudents,
        byYear: studentsByYear,
        bySection: studentsBySection,
      },
      odRequests: odSummary,
      activities: activitySummary,
      reviews: reviewSummary,
      events: eventSummary,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return apiError('FORBIDDEN', 'HOD authorization required.', 403);
    }
    console.error('Error in GET /api/v1/reports/summary:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
