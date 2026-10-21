import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';
import { serializeReportSummary } from '@/lib/api/serializers';

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
    const allStuds: any[] = students || [];
    const studentsByYear = {
      I: allStuds.filter((s: any) => s.year === 'I').length || 0,
      II: allStuds.filter((s: any) => s.year === 'II').length || 0,
      III: allStuds.filter((s: any) => s.year === 'III').length || 0,
      IV: allStuds.filter((s: any) => s.year === 'IV').length || 0,
    };
    const studentsBySection = {
      A: allStuds.filter((s: any) => s.section === 'A').length || 0,
      B: allStuds.filter((s: any) => s.section === 'B').length || 0,
      C: allStuds.filter((s: any) => s.section === 'C').length || 0,
      D: allStuds.filter((s: any) => s.section === 'D').length || 0,
      E: allStuds.filter((s: any) => s.section === 'E').length || 0,
    };

    // 2. Query OD Requests Summary
    const { data: odRequests, error: odErr } = await supabase
      .from('od_requests')
      .select('id, status, total_days');

    if (odErr) {
      console.error('Error fetching OD requests:', odErr);
      return apiError('DATABASE_ERROR', odErr.message, 500);
    }

    const allODs: any[] = odRequests || [];
    const odSummary = {
      total: allODs.length,
      pending: allODs.filter((o: any) => o.status === 'PENDING').length,
      approved: allODs.filter((o: any) => o.status === 'APPROVED').length,
      rejected: allODs.filter((o: any) => o.status === 'REJECTED').length,
      revisionRequested: allODs.filter((o: any) => o.status === 'REVISION_REQUESTED').length,
      totalApprovedDays: allODs
        .filter((o: any) => o.status === 'APPROVED')
        .reduce((sum: number, o: any) => sum + (o.total_days || 1), 0),
    };

    // 3. Query Activities Summary
    const { data: activities, error: actErr } = await supabase
      .from('activities')
      .select('id, type, status');

    if (actErr) {
      console.error('Error fetching activities:', actErr);
      return apiError('DATABASE_ERROR', actErr.message, 500);
    }

    const allActs: any[] = activities || [];
    const activitySummary = {
      total: allActs.length,
      projects: allActs.filter((a: any) => a.type === 'PROJECT').length,
      hackathons: allActs.filter((a: any) => a.type === 'HACKATHON').length,
      internships: allActs.filter((a: any) => a.type === 'INTERNSHIP').length,
      statusBreakdown: {
        submitted: allActs.filter((a: any) => a.status === 'SUBMITTED').length,
        active: allActs.filter((a: any) => a.status === 'ACTIVE' || a.status === 'APPROVED').length,
        rejected: allActs.filter((a: any) => a.status === 'REJECTED').length,
        revisionRequested: allActs.filter((a: any) => a.status === 'REVISION_REQUESTED').length,
        completed: allActs.filter((a: any) => a.status === 'COMPLETED').length,
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

    const allReviews: any[] = reviewSessions || [];
    const reviewSummary = {
      total: allReviews.length,
      scheduled: allReviews.filter((r: any) => r.status === 'SCHEDULED').length,
      completed: allReviews.filter((r: any) => r.status === 'COMPLETED').length,
      totalAttendedCount: (attendanceList || []).length,
    };

    // 5. Query Events Summary
    const { data: events } = await supabase
      .from('events')
      .select('id, status');

    const allEvents: any[] = events || [];
    const eventSummary = {
      total: allEvents.length,
      upcoming: allEvents.filter((e: any) => e.status === 'UPCOMING').length,
      ongoing: allEvents.filter((e: any) => e.status === 'ONGOING').length,
      completed: allEvents.filter((e: any) => e.status === 'COMPLETED').length,
    };

    return apiSuccess(
      serializeReportSummary({
        department: 'Computer Science and Engineering',
        academic_year: '2026-2027',
        total_students: totalStudents,
        active_ods: odSummary.pending + odSummary.approved,
        total_activities: activitySummary.total,
        upcoming_reviews: reviewSummary.scheduled,
        students: {
          total: totalStudents,
          by_year: studentsByYear,
          by_section: studentsBySection,
        },
        od_requests: {
          total: odSummary.total,
          pending: odSummary.pending,
          approved: odSummary.approved,
          rejected: odSummary.rejected,
          revision_requested: odSummary.revisionRequested,
          total_approved_days: odSummary.totalApprovedDays,
        },
        activities: {
          total: activitySummary.total,
          projects: activitySummary.projects,
          hackathons: activitySummary.hackathons,
          internships: activitySummary.internships,
          status_breakdown: {
            submitted: activitySummary.statusBreakdown.submitted,
            active: activitySummary.statusBreakdown.active,
            rejected: activitySummary.statusBreakdown.rejected,
            revision_requested: activitySummary.statusBreakdown.revisionRequested,
            completed: activitySummary.statusBreakdown.completed,
          },
        },
        reviews: {
          total: reviewSummary.total,
          scheduled: reviewSummary.scheduled,
          completed: reviewSummary.completed,
          total_attended_count: reviewSummary.totalAttendedCount,
        },
        events: {
          total: eventSummary.total,
          upcoming: eventSummary.upcoming,
          ongoing: eventSummary.ongoing,
          completed: eventSummary.completed,
        },
      })
    );
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
