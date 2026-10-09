import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

// GET /api/v1/reports/accreditation - NAAC/NBA Accreditation Metrics (HOD Only)
export async function GET(request: NextRequest) {
  try {
    await requireRole(['HOD']);
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academic_year') || '2026-2027';

    const supabase = await createClient();

    // 1. NAAC Criterion 1.3.2: Value-Added Projects
    const { data: projectList } = await supabase
      .from('activities')
      .select('id, status')
      .eq('type', 'PROJECT');

    const totalProjects = projectList?.length || 0;
    const activeCapstones = projectList?.filter(
      (p) => p.status === 'ACTIVE' || p.status === 'APPROVED'
    ).length || 0;

    // 2. NAAC Criterion 5.3.1: Hackathon Entries / Awards
    const { data: hackathonList } = await supabase
      .from('activities')
      .select('id, student_id')
      .eq('type', 'HACKATHON');

    const totalHackathons = hackathonList?.length || 0;
    const uniqueStudentsHackathon = new Set(
      (hackathonList || []).map((h) => h.student_id).filter(Boolean)
    ).size;

    // 3. NAAC Criterion 1.3.3: Industry Internships (NOC Issued)
    const { data: internshipList } = await supabase
      .from('activities')
      .select('id, status')
      .eq('type', 'INTERNSHIP');

    const totalInternships = internshipList?.length || 0;
    const verifiedInternships = internshipList?.filter(
      (i) => i.status === 'ACTIVE' || i.status === 'APPROVED' || i.status === 'COMPLETED'
    ).length || 0;

    // 4. NAAC Criterion 5.3.3: Total Approved OD Clearances
    const { data: approvedODs } = await supabase
      .from('od_requests')
      .select('id')
      .eq('status', 'APPROVED');

    const totalApprovedODClearances = approvedODs?.length || 0;

    return apiSuccess({
      academic_year: academicYear,
      department: 'Computer Science and Engineering',
      metrics: {
        criteria_1_3_2: {
          label: 'Value-Added Projects',
          count: totalProjects,
          active_capstones: activeCapstones,
        },
        criteria_5_3_1: {
          label: 'Hackathon Entries / Awards',
          count: totalHackathons,
          unique_students: uniqueStudentsHackathon,
        },
        criteria_1_3_3: {
          label: 'Industry Internships (NOC Issued)',
          count: totalInternships,
          verified: verifiedInternships,
        },
        total_approved_od_clearances: totalApprovedODClearances,
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return apiError('FORBIDDEN', 'HOD authorization required.', 403);
    }
    console.error('Error in GET /api/v1/reports/accreditation:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
