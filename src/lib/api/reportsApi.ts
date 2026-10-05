/**
 * NAAC / NBA Accreditation Summary & Reports API Client
 * SIET CSE Department Platform - API Contract v2.0
 *
 * Implements dynamic criteria metrics (1.3.2, 5.3.1, 1.3.3, OD clearances),
 * summary statistics, and accreditation export streaming.
 */

import { apiClient, ApiError, buildQueryString } from './client';
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
   * GET /api/v1/reports/summary
   * High-level departmental count summary
   */
  async getSummary(): Promise<{ data: ApiReportSummary }> {
    return apiClient.get<{ data: ApiReportSummary }>('/api/v1/reports/summary', {
      fallback: () => ({ data: fixtureReportSummary }),
    });
  },

  /**
   * GET /api/v1/reports/accreditation
   * HOD NAAC / NBA Criteria Metrics (1.3.2, 5.3.1, 1.3.3, Total OD Clearances)
   */
  async getAccreditation(
    academicYear?: string
  ): Promise<{ data: ApiAccreditationMetrics }> {
    return apiClient.get<{ data: ApiAccreditationMetrics }>(
      '/api/v1/reports/accreditation',
      {
        params: { academic_year: academicYear || '2026-2027' },
        fallback: () => ({ data: fixtureAccreditationReport }),
      }
    );
  },

  /**
   * Returns a ready-to-use URL for the reports CSV export endpoint
   */
  getExportUrl(params?: { academic_year?: string; format?: string }): string {
    const query = buildQueryString(params as Record<string, string>);
    return `/api/v1/reports/export${query}`;
  },

  /**
   * GET /api/v1/reports/export
   * Direct fetcher for reports CSV export content
   */
  async downloadExport(params?: { academic_year?: string; format?: string }): Promise<string> {
    const query = buildQueryString(params as Record<string, string>);
    const res = await fetch(`/api/v1/reports/export${query}`);
    if (!res.ok) {
      throw new ApiError('EXPORT_FAILED', `Failed to export reports: ${res.statusText}`, res.status);
    }
    return res.text();
  },

  /**
   * Fetches the consolidated student report card
   */
  async getStudentReportSummary(): Promise<{ data: StudentReportSummary }> {
    return {
      data: this.getFallbackStudentReport(),
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
