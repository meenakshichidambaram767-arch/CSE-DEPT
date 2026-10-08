/**
 * HOD Student Records API Module (Phase 6)
 * API Contract v2.0 compliant
 * Offline mock resolver - guaranteed zero live backend network egress
 */

import { assertNoLiveNetwork, ApiError } from './client';
import {
  StudentRecordContract,
  StudentRecordListResponse,
  StudentRecordQuery,
  StudentSummaryResponse,
} from './contractTypes';

// Initial contract-compatible student records dataset
const studentRecordsStore: StudentRecordContract[] = [
  {
    id: 'usr-student-001',
    name: 'Meena C',
    register_number: '714023104088',
    email: 'meena.23cse@siet.ac.in',
    department: 'CSE',
    year: 'II',
    section: 'B',
    approved_od_count: 2,
    activity_count: 3,
    review_count: 8,
  },
  {
    id: 'usr-student-002',
    name: 'Nakshatra S V',
    register_number: '714022104153',
    email: 'nakshatra.22cse@siet.ac.in',
    department: 'CSE',
    year: 'IV',
    section: 'A',
    approved_od_count: 3,
    activity_count: 2,
    review_count: 6,
  },
  {
    id: 'usr-student-003',
    name: 'Vishwanath M',
    register_number: '714022104210',
    email: 'vishwanath.22cse@siet.ac.in',
    department: 'CSE',
    year: 'IV',
    section: 'C',
    approved_od_count: 1,
    activity_count: 2,
    review_count: 4,
  },
  {
    id: 'usr-student-004',
    name: 'Aswin K',
    register_number: '714022104032',
    email: 'aswin.22cse@siet.ac.in',
    department: 'CSE',
    year: 'IV',
    section: 'B',
    approved_od_count: 2,
    activity_count: 1,
    review_count: 5,
  },
  {
    id: 'usr-student-005',
    name: 'Karthik Raja P',
    register_number: '714023104089',
    email: 'karthik.23cse@siet.ac.in',
    department: 'CSE',
    year: 'II',
    section: 'A',
    approved_od_count: 1,
    activity_count: 2,
    review_count: 3,
  },
  {
    id: 'usr-student-006',
    name: 'Naveen Kumar S',
    register_number: '714023104090',
    email: 'naveen.23cse@siet.ac.in',
    department: 'CSE',
    year: 'II',
    section: 'C',
    approved_od_count: 0,
    activity_count: 1,
    review_count: 2,
  },
  {
    id: 'usr-student-007',
    name: 'Priyadharshini R',
    register_number: '714024104045',
    email: 'priya.24cse@siet.ac.in',
    department: 'CSE',
    year: 'I',
    section: 'A',
    approved_od_count: 1,
    activity_count: 1,
    review_count: 1,
  },
  {
    id: 'usr-student-008',
    name: 'Dinesh Karthik T',
    register_number: '714024104078',
    email: 'dinesh.24cse@siet.ac.in',
    department: 'CSE',
    year: 'I',
    section: 'B',
    approved_od_count: 0,
    activity_count: 1,
    review_count: 0,
  },
  {
    id: 'usr-student-009',
    name: 'Sneha Varshini M',
    register_number: '714021104112',
    email: 'sneha.21cse@siet.ac.in',
    department: 'CSE',
    year: 'III',
    section: 'A',
    approved_od_count: 4,
    activity_count: 4,
    review_count: 7,
  },
  {
    id: 'usr-student-010',
    name: 'Rohit Balaji S',
    register_number: '714021104135',
    email: 'rohit.21cse@siet.ac.in',
    department: 'CSE',
    year: 'III',
    section: 'B',
    approved_od_count: 2,
    activity_count: 2,
    review_count: 5,
  },
  {
    id: 'usr-student-011',
    name: 'Harish Raghavan V',
    register_number: '714021104144',
    email: 'harish.21cse@siet.ac.in',
    department: 'CSE',
    year: 'III',
    section: 'C',
    approved_od_count: 3,
    activity_count: 3,
    review_count: 6,
  },
  {
    id: 'usr-student-012',
    name: 'Ananya Sreedharan',
    register_number: '714024104012',
    email: 'ananya.24cse@siet.ac.in',
    department: 'CSE',
    year: 'I',
    section: 'D',
    approved_od_count: 1,
    activity_count: 1,
    review_count: 1,
  },
];

export const recordsApi = {
  /**
   * GET /api/v1/records/students
   */
  getStudents: async (query?: StudentRecordQuery): Promise<StudentRecordListResponse> => {
    assertNoLiveNetwork();

    let filtered = [...studentRecordsStore];

    if (query?.year) {
      filtered = filtered.filter((s) => s.year === query.year);
    }

    if (query?.section) {
      filtered = filtered.filter((s) => s.section === query.section);
    }

    if (query?.search && query.search.trim().length > 0) {
      const q = query.search.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.register_number.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    const page = Math.max(1, query?.page || 1);
    const pageSize = Math.max(1, query?.page_size || 10);
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize) || 1;

    const startIndex = (page - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    return {
      students: paginated,
      total,
      page,
      page_size: pageSize,
      total_pages: totalPages,
    };
  },

  /**
   * GET /api/v1/records/students/{id}/summary
   */
  getStudentSummary: async (id: string): Promise<StudentSummaryResponse> => {
    assertNoLiveNetwork();

    const student = studentRecordsStore.find((s) => s.id === id || s.register_number === id);
    if (!student) {
      throw new ApiError(404, 'STUDENT_NOT_FOUND', `Student record not found for identifier: ${id}`, {
        student_id: id,
      });
    }

    // Return contract-shaped summaries
    return {
      student: {
        id: student.id,
        name: student.name,
        register_number: student.register_number,
        email: student.email,
        department: student.department,
        year: student.year,
        section: student.section,
      },
      od_clearances: [
        {
          id: `OD-${student.register_number}-01`,
          event_name: 'National HackSprint 36-Hour Hackathon',
          date: '2026-10-05',
          status: 'APPROVED',
          approved_at: '2026-09-22T10:00:00Z',
        },
        {
          id: `OD-${student.register_number}-02`,
          event_name: 'AI & Edge Computing Symposium',
          date: '2026-09-15',
          status: 'APPROVED',
          approved_at: '2026-09-12T14:30:00Z',
        },
      ],
      activities: [
        {
          id: `PRJ-${student.register_number}`,
          title: 'AI-Based Examination Monitoring System',
          type: 'PROJECT',
          status: 'ACTIVE',
          role: 'Team Lead',
        },
        {
          id: `HCK-${student.register_number}`,
          title: 'HackSprint 2026 Accessibility Tool',
          type: 'HACKATHON',
          status: 'APPROVED',
          role: 'Participant',
        },
      ],
      reviews: [
        {
          id: `REV-${student.register_number}-01`,
          review_type: 'PROJECT_WEEKLY',
          date: '25 September 2026',
          status: 'COMPLETED',
          attended: true,
        },
        {
          id: `REV-${student.register_number}-02`,
          review_type: 'PROJECT_WEEKLY',
          date: '02 October 2026',
          status: 'SCHEDULED',
          attended: false,
        },
      ],
    };
  },

  /**
   * GET /api/v1/records/export
   */
  exportRecords: async (query?: StudentRecordQuery): Promise<string> => {
    assertNoLiveNetwork();

    let filtered = [...studentRecordsStore];

    if (query?.year) {
      filtered = filtered.filter((s) => s.year === query.year);
    }

    if (query?.section) {
      filtered = filtered.filter((s) => s.section === query.section);
    }

    if (query?.search && query.search.trim().length > 0) {
      const q = query.search.toLowerCase().trim();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.register_number.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    // RFC 4180 CSV generation
    const header = ['Student ID', 'Register Number', 'Name', 'Email', 'Department', 'Year', 'Section', 'Approved OD Clearances', 'Activities', 'Reviews'];
    const rows = filtered.map((s) => [
      s.id,
      s.register_number,
      `"${s.name.replace(/"/g, '""')}"`,
      s.email,
      s.department,
      s.year,
      s.section,
      s.approved_od_count.toString(),
      s.activity_count.toString(),
      s.review_count.toString(),
    ]);

    return [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  },
};
