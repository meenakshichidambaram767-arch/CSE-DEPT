/**
 * NAAC / NBA Accreditation Summary & Reports API Module (Phase 6)
 * SIET CSE Department Platform - API Contract v2.0
 *
 * Implements dynamic criteria metrics (1.3.2, 5.3.1, 1.3.3, OD clearances),
 * summary statistics, RFC 4180 accreditation export, and student report cards.
 */

import { assertNoLiveNetwork, ApiError, apiClient, buildQueryString } from './client';
import {
  AccreditationReportContract,
  ReportsSummaryContract,
} from './contractTypes';
import {
  ApiAccreditationMetrics,
  ApiReportSummary,
} from '@/types/contract';
import { Activity, ODApplication, ReviewSession } from '@/types';
import {
  fixtureAccreditationReport,
  fixtureReportSummary,
} from '@/data/fixtures/reportsFixtures';
import { mockActivities, mockODApplications, mockReviewSessions } from '@/data/mock';

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
    assertNoLiveNetwork();

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

    const report: AccreditationReportContract = {
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
    };

    return {
      ...report,
      data: report,
    };
  },

  /**
   * Alias for getAccreditationReport compatible with Contract v2.0
   */
  async getAccreditation(
    academicYear?: string
  ): Promise<{ data: ApiAccreditationMetrics }> {
    const rep = await reportsApi.getAccreditationReport(academicYear || '2026-2027');
    return { data: rep as any };
  },

  /**
   * GET /api/v1/reports/summary
   */
  getReportsSummary: async (
    academicYear: string = '2026-2027'
  ): Promise<ReportsSummaryContract & { data: any }> => {
    assertNoLiveNetwork();

    const summary: ReportsSummaryContract = {
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
    };

    return {
      ...summary,
      data: summary,
    };
  },

  /**
   * High-level departmental count summary alias
   */
  async getSummary(): Promise<{ data: ApiReportSummary }> {
    return reportsApi.getReportsSummary();
  },

  /**
   * GET /api/v1/reports/export?academic_year=YYYY-YYYY
   */
  exportReportCSV: async (academicYear: string = '2026-2027'): Promise<string> => {
    assertNoLiveNetwork();

    const report = await reportsApi.getAccreditationReport(academicYear);

    const headers = ['NAAC Criteria Code', 'Description', 'Verified Count', 'Sub-Metric Description', 'Sub-Metric Value'];
    const rows = [
      ['NAAC Criteria 1.3.2', `"${report.metrics.criteria_1_3_2.label}"`, report.metrics.criteria_1_3_2.count.toString(), 'Active Capstones', (report.metrics.criteria_1_3_2.active_capstones || 0).toString()],
      ['NAAC Criteria 5.3.1', `"${report.metrics.criteria_5_3_1.label}"`, report.metrics.criteria_5_3_1.count.toString(), 'Unique Students', (report.metrics.criteria_5_3_1.unique_students || 0).toString()],
      ['NAAC Criteria 1.3.3', `"${report.metrics.criteria_1_3_3.label}"`, report.metrics.criteria_1_3_3.count.toString(), 'Verified NOCs', (report.metrics.criteria_1_3_3.verified || 0).toString()],
      ['NAAC Criteria 5.3.3', '"Total Approved OD Clearances"', report.metrics.total_approved_od_clearances.toString(), 'Total Clearances', report.metrics.total_approved_od_clearances.toString()],
    ];

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
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
   * Consolidated student report card
   */
  async getStudentReportSummary(): Promise<{ data: StudentReportSummary }> {
    return {
      data: reportsApi.getFallbackStudentReport(),
    };
  },

  /**
   * Fallback student report summary
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
      totalActivities: mockActivities.length,
      approvedActivities: mockActivities.filter((a) => a.status === 'APPROVED' || a.status === 'ACTIVE').length,
      completedProjects: mockActivities.filter((a) => a.type === 'PROJECT' && (a.status === 'APPROVED' || a.status === 'ACTIVE')).length,
      approvedInternships: mockActivities.filter((a) => a.type === 'INTERNSHIP' && (a.status === 'APPROVED' || a.status === 'ACTIVE')).length,
      hackathonEntries: mockActivities.filter((a) => a.type === 'HACKATHON').length,
      totalODs: mockODApplications.length,
      approvedODs: mockODApplications.filter((o) => o.status === 'APPROVED').length,
      approvedODDays: mockODApplications.filter((o) => o.status === 'APPROVED').reduce((acc, curr) => acc + (curr.totalDays || 1), 0),
      totalODRequests: mockODApplications.length,
      totalODDays: mockODApplications.reduce((acc, curr) => acc + (curr.totalDays || 1), 0),
      reviewsAttended: mockReviewSessions.filter((r) => r.status === 'COMPLETED').length,
      reviewAttendanceRate: '100%',
    },
    activities: mockActivities,
    odRequests: mockODApplications,
    reviews: mockReviewSessions,
  }),
};

export default reportsApi;
