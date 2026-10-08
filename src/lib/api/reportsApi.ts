/**
 * HOD Reports / Accreditation API Module (Phase 6)
 * API Contract v2.0 compliant
 * Offline mock resolver - guaranteed zero live backend network egress
 */

import { assertNoLiveNetwork, ApiError } from './client';
import {
  AccreditationReportContract,
  ReportsSummaryContract,
} from './contractTypes';

export const reportsApi = {
  /**
   * GET /api/v1/reports/accreditation?academic_year=YYYY-YYYY
   */
  getAccreditationReport: async (
    academicYear: string = '2026-2027'
  ): Promise<AccreditationReportContract> => {
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

    return {
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
  },

  /**
   * GET /api/v1/reports/summary
   */
  getReportsSummary: async (
    academicYear: string = '2026-2027'
  ): Promise<ReportsSummaryContract> => {
    assertNoLiveNetwork();

    return {
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
};
