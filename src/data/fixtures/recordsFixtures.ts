/**
 * Contract-Compatible Fixtures: Departmental Records Domain
 * Conforms 100% to API Contract v2.0
 */

import { ApiStudentRecord, ApiStudentSummary, PaginatedResponse } from '@/types/contract';
import { fixtureApiODs } from './odFixtures';
import { fixtureApiActivities } from './activitiesFixtures';
import { fixtureApiReviews } from './reviewsFixtures';

export const fixtureApiStudents: ApiStudentRecord[] = [
  {
    id: 'rec-std-001',
    userId: 'usr-student-001',
    registerNumber: '714023104088',
    regNo: '714023104088',
    name: 'Meena C',
    department: 'CSE',
    year: 'III',
    section: 'B',
    email: 'meena.23cse@siet.ac.in',
    createdAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'rec-std-002',
    userId: 'usr-student-002',
    registerNumber: '714022104153',
    regNo: '714022104153',
    name: 'Nakshatra S V',
    department: 'CSE',
    year: 'IV',
    section: 'C',
    email: 'nakshatra.22cse@siet.ac.in',
    createdAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'rec-std-003',
    userId: 'usr-student-003',
    registerNumber: '714022104210',
    regNo: '714022104210',
    name: 'Vishwanath M',
    department: 'CSE',
    year: 'IV',
    section: 'D',
    email: 'vishwanath.22cse@siet.ac.in',
    createdAt: '2026-08-01T00:00:00Z',
  },
];

export const fixturePaginatedStudents: PaginatedResponse<ApiStudentRecord> = {
  data: fixtureApiStudents,
  meta: {
    page: 1,
    page_size: 20,
    total: 3,
  },
};

export const fixtureStudentSummary: ApiStudentSummary = {
  student: fixtureApiStudents[0],
  stats: {
    total_ods: 1,
    approved_ods: 1,
    total_activities: 2,
    active_activities: 2,
    total_reviews: 2,
    attendance_rate: 100,
  },
  recent_ods: [fixtureApiODs[0]],
  activities: [fixtureApiActivities[0], fixtureApiActivities[1]],
  reviews: fixtureApiReviews,
};
