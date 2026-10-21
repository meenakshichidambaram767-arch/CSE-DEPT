/**
 * NAAC / NBA Accreditation Summary & Reports API Module (Phase 6)
 * SIET CSE Department Platform - API Contract v2.0
 *
 * Implements dynamic criteria metrics (1.3.2, 5.3.1, 1.3.3, OD clearances),
 * summary statistics, RFC 4180 accreditation export, and student report cards.
 */

import { ApiError, apiClient, buildQueryString, areDevMocksEnabled } from './client';
import {
  AccreditationReportContract,
  ReportsSummaryContract,
} from './contractTypes';
import {
  ApiAccreditationMetrics,
  ApiReportSummary,
} from '@/types/contract';
import { Activity, ODApplication, ReviewSession } from '@/types';

export { ApiError };

export interface StudentReportSummary {
  student: {
    id: string;
    name: string;
    email: string;
    registerNumber: string;
    department: string;
    year: string;
    section?: string;
  };
  metrics: {
    totalActivities: number;
    approvedActivities: number;
    completedProjects?: number;
    approvedInternships?: number;
    hackathonEntries?: number;
    totalODs: number;
    approvedODs: number;
    approvedODDays?: number;
    totalODRequests?: number;
    totalODDays: number;
    reviewsAttended?: number;
    reviewAttendanceRate: string;
  };
  activities?: Activity[];
  odRequests?: ODApplication[];
  reviews?: ReviewSession[];
}

export const reportsApi = {
  /**
   * GET /api/v1/reports/accreditation?academic_year=YYYY-YYYY
   */
  getAccreditationReport: async (
    academicYear: string = '2026-2027'
  ): Promise<AccreditationReportContract & { data: any }> => {
    // Validate academic year format YYYY-YYYY
    const yearPattern = /^\d{4}-\d{4}$/;
    if (!yearPattern.test(academicYear.trim())) {
      throw new ApiError(
        400,
        'INVALID_ACADEMIC_YEAR',
        'academic_year must be in YYYY-YYYY format (e.g. 2026-2027)',
        { academic_year: 'Format must be YYYY-YYYY' }
      );
    }

    const res = await apiClient.get<AccreditationReportContract & { data: any }>(
      '/api/v1/reports/accreditation',
      {
        params: { academic_year: academicYear },
        fallback: () => ({
          academic_year: academicYear,
          department: 'Computer Science and Engineering',
          metrics: {
            criteria_1_3_2: {
              label: 'Value-Added Projects',
              count: 48,
              active_capstones: 32,
            },
            criteria_5_3_1: {
              label: 'Hackathon Entries / Awards',
              count: 26,
              unique_students: 64,
            },
            criteria_1_3_3: {
              label: 'Industry Internships (NOC Issued)',
              count: 39,
              verified: 37,
            },
            total_approved_od_clearances: 312,
          },
          data: {
            academic_year: academicYear,
            department: 'Computer Science and Engineering',
            metrics: {
              criteria_1_3_2: {
                label: 'Value-Added Projects',
                count: 48,
                active_capstones: 32,
              },
              criteria_5_3_1: {
                label: 'Hackathon Entries / Awards',
                count: 26,
                unique_students: 64,
              },
              criteria_1_3_3: {
                label: 'Industry Internships (NOC Issued)',
                count: 39,
                verified: 37,
              },
              total_approved_od_clearances: 312,
            },
          },
        }),
      }
    );

    return {
      ...res,
      data: res.data || res,
    };
  },

  /**
   * Alias for getAccreditationReport compatible with Contract v2.0
   */
  async getAccreditation(
    academicYear?: string
  ): Promise<{ data: ApiAccreditationMetrics }> {
    const rep = await reportsApi.getAccreditationReport(academicYear || '2026-2027');
    return { data: (rep.data || rep) as ApiAccreditationMetrics };
  },

  /**
   * GET /api/v1/reports/summary
   */
  getReportsSummary: async (
    academicYear: string = '2026-2027'
  ): Promise<ReportsSummaryContract & { data: any }> => {
    const res = await apiClient.get<ReportsSummaryContract & { data: any }>(
      '/api/v1/reports/summary',
      {
        params: { academic_year: academicYear },
        fallback: () => ({
          academic_year: academicYear,
          department: 'Computer Science and Engineering',
          total_activities: 113,
          total_approved_ods: 312,
          total_completed_reviews: 142,
          criteria_breakdown: {
            criteria_1_3_2: 48,
            criteria_5_3_1: 26,
            criteria_1_3_3: 39,
          },
          data: {
            academic_year: academicYear,
            department: 'Computer Science and Engineering',
            total_activities: 113,
            total_approved_ods: 312,
            total_completed_reviews: 142,
            criteria_breakdown: {
              criteria_1_3_2: 48,
              criteria_5_3_1: 26,
              criteria_1_3_3: 39,
            },
          },
        }),
      }
    );

    return {
      ...res,
      data: res.data || res,
    };
  },

  /**
   * High-level departmental count summary alias
   */
  async getSummary(): Promise<{ data: ApiReportSummary }> {
    const res = await reportsApi.getReportsSummary();
    return { data: (res.data || res) as ApiReportSummary };
  },

  /**
   * GET /api/v1/reports/export?academic_year=YYYY-YYYY
   */
  exportReportCSV: async (academicYear: string = '2026-2027'): Promise<string> => {
    const queryStr = buildQueryString({ academic_year: academicYear });
    const url = `/api/v1/reports/export${queryStr}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new ApiError(res.status, 'EXPORT_FAILED', `Failed to export reports CSV (HTTP ${res.status})`);
      }
      return await res.text();
    } catch (err) {
      if (areDevMocksEnabled()) {
        const report = await reportsApi.getAccreditationReport(academicYear);
        const headers = ['NAAC Criteria Code', 'Description', 'Verified Count', 'Sub-Metric Description', 'Sub-Metric Value'];
        const rows = [
          ['NAAC Criteria 1.3.2', `"${report.metrics.criteria_1_3_2.label}"`, report.metrics.criteria_1_3_2.count.toString(), 'Active Capstones', (report.metrics.criteria_1_3_2.active_capstones || 0).toString()],
          ['NAAC Criteria 5.3.1', `"${report.metrics.criteria_5_3_1.label}"`, report.metrics.criteria_5_3_1.count.toString(), 'Unique Students', (report.metrics.criteria_5_3_1.unique_students || 0).toString()],
          ['NAAC Criteria 1.3.3', `"${report.metrics.criteria_1_3_3.label}"`, report.metrics.criteria_1_3_3.count.toString(), 'Verified NOCs', (report.metrics.criteria_1_3_3.verified || 0).toString()],
          ['NAAC Criteria 5.3.3', '"Total Approved OD Clearances"', report.metrics.total_approved_od_clearances.toString(), 'Total Clearances', report.metrics.total_approved_od_clearances.toString()],
        ];
        return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      }
      throw err;
    }
  },

  /**
   * Returns a ready-to-use URL for the reports CSV export endpoint
   */
  getExportUrl(params?: { academic_year?: string; format?: string }): string {
    const query = buildQueryString(params as Record<string, string>);
    return `/api/v1/reports/export${query}`;
  },

  /**
   * Direct fetcher for reports CSV export content
   */
  async downloadExport(params?: { academic_year?: string; format?: string }): Promise<string> {
    return reportsApi.exportReportCSV(params?.academic_year || '2026-2027');
  },

  /**
   * Consolidated student report card computed from real API endpoints
   */
  async getStudentReportSummary(): Promise<{ data: StudentReportSummary }> {
    try {
      const meRes = await apiClient.get<{ user: any; student_profile?: any }>('/api/v1/me');
      const student = {
        id: meRes.user?.id || 'usr-student-001',
        name: meRes.user?.name || meRes.student_profile?.name || 'Student',
        email: meRes.user?.email || '',
        registerNumber: meRes.student_profile?.register_number || meRes.user?.register_number || '',
        department: meRes.student_profile?.department || 'Computer Science and Engineering',
        year: meRes.student_profile?.year || 'IV',
        section: meRes.student_profile?.section || 'A',
      };

      const [odsRes, actsRes, revsRes] = await Promise.all([
        apiClient.get<any>('/api/v1/od-requests').catch(() => ({ data: [] })),
        apiClient.get<any>('/api/v1/activities').catch(() => ({ data: [] })),
        apiClient.get<any>('/api/v1/reviews/sessions').catch(() => ({ data: [] })),
      ]);

      const ods = Array.isArray(odsRes) ? odsRes : odsRes.data || odsRes.od_requests || [];
      const activities = Array.isArray(actsRes) ? actsRes : actsRes.data || actsRes.activities || [];
      const reviews = Array.isArray(revsRes) ? revsRes : revsRes.data || revsRes.sessions || [];

      const approvedODs = ods.filter((o: any) => o.status === 'APPROVED');
      const approvedActs = activities.filter((a: any) => a.status === 'APPROVED' || a.status === 'ACTIVE' || a.status === 'COMPLETED');
      const completedRevs = reviews.filter((r: any) => r.status === 'COMPLETED');

      const metrics = {
        totalActivities: activities.length,
        approvedActivities: approvedActs.length,
        completedProjects: activities.filter((a: any) => a.type === 'PROJECT' && (a.status === 'APPROVED' || a.status === 'ACTIVE' || a.status === 'COMPLETED')).length,
        approvedInternships: activities.filter((a: any) => a.type === 'INTERNSHIP' && (a.status === 'APPROVED' || a.status === 'ACTIVE' || a.status === 'COMPLETED')).length,
        hackathonEntries: activities.filter((a: any) => a.type === 'HACKATHON').length,
        totalODs: ods.length,
        approvedODs: approvedODs.length,
        approvedODDays: approvedODs.reduce((acc: number, curr: any) => acc + (curr.total_days || curr.totalDays || 1), 0),
        totalODRequests: ods.length,
        totalODDays: ods.reduce((acc: number, curr: any) => acc + (curr.total_days || curr.totalDays || 1), 0),
        reviewsAttended: completedRevs.length,
        reviewAttendanceRate: reviews.length > 0 ? `${Math.round((completedRevs.length / reviews.length) * 100)}%` : '100%',
      };

      return {
        data: {
          student,
          metrics,
          activities,
          odRequests: ods,
          reviews,
        },
      };
    } catch (err) {
      if (areDevMocksEnabled()) {
        return { data: reportsApi.getFallbackStudentReport() };
      }
      throw err;
    }
  },

  /**
   * Fallback student report summary (dev/mock only)
   */
  getFallbackStudentReport: (): StudentReportSummary => ({
    student: {
      id: 'usr-student-001',
      name: 'Meena C',
      email: 'meena.23cse@siet.ac.in',
      registerNumber: '714023104088',
      department: 'Computer Science and Engineering',
      year: 'III',
      section: 'B',
    },
    metrics: {
      totalActivities: 0,
      approvedActivities: 0,
      completedProjects: 0,
      approvedInternships: 0,
      hackathonEntries: 0,
      totalODs: 0,
      approvedODs: 0,
      approvedODDays: 0,
      totalODRequests: 0,
      totalODDays: 0,
      reviewsAttended: 0,
      reviewAttendanceRate: '0%',
    },
    activities: [],
    odRequests: [],
    reviews: [],
  }),
};

export default reportsApi;
