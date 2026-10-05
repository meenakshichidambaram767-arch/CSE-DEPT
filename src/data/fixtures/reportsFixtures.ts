/**
 * Contract-Compatible Fixtures: NAAC/NBA Accreditation & Reports Domain
 * Conforms 100% to API Contract v2.0
 */

import { ApiAccreditationMetrics, ApiReportSummary } from '@/types/contract';

export const fixtureAccreditationReport: ApiAccreditationMetrics = {
  academic_year: '2026-2027',
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

export const fixtureReportSummary: ApiReportSummary = {
  total_students: 450,
  active_ods: 18,
  total_activities: 112,
  upcoming_reviews: 14,
};
