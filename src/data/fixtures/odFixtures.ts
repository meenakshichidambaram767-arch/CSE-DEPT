/**
 * Contract-Compatible Fixtures: On-Duty (OD) Domain
 * Conforms 100% to API Contract v2.0
 */

import { ApiODRequest, ODConflictResponse, PaginatedResponse } from '@/types/contract';

export const fixtureApiODs: ApiODRequest[] = [
  {
    id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    code: 'OD-2026-001',
    student_id: 'usr-student-001',
    student_name: 'Meena C',
    student_reg_no: '714023104088',
    department: 'CSE',
    year: 'III',
    section: 'B',
    purpose: 'HACKATHON',
    event_id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    activity_id: 'act-sih-2026',
    event_name: 'Smart India Hackathon 2026 Grand Finale',
    reason: 'Representing college at the National Final round for AI theme.',
    start_date: '2026-10-15',
    end_date: '2026-10-17',
    from_time: '09:00:00',
    to_time: '18:00:00',
    slot_type: 'FULL_DAY',
    total_days: 3,
    venue: 'IIT Madras Research Park, Chennai',
    registration_id: 'SIH-2026-9921',
    team_members: [
      { register_number: '714023104088', name: 'Meena C', role: 'TEAM_LEAD' },
      { register_number: '714022104002', name: 'Nattu K', role: 'MEMBER' },
    ],
    document_ids: ['f82b86c3-631d-4eb4-ba09-842f6aa4ce81'],
    documents: [
      {
        id: 'f82b86c3-631d-4eb4-ba09-842f6aa4ce81',
        file_name: 'SIH_Final_Shortlist_Letter.pdf',
        document_type: 'SELECTION_LETTER',
        size: 1420000,
      },
    ],
    status: 'APPROVED',
    remarks: 'Approved for national level competition. Ensure missed lab work is completed.',
    submitted_date: '2026-10-01T08:30:00Z',
    approved_date: '2026-10-02T11:15:00Z',
    created_at: '2026-10-01T08:30:00Z',
  },
  {
    id: '8a123bc4-5566-7788-99aa-bbccddeeff00',
    code: 'OD-2026-002',
    student_id: 'usr-student-002',
    student_name: 'Nakshatra S V',
    student_reg_no: '714022104153',
    department: 'CSE',
    year: 'IV',
    section: 'C',
    purpose: 'INTERNSHIP',
    event_id: null,
    activity_id: 'act-zoho-intern-01',
    event_name: 'Zoho Corporation On-Site Technical Evaluation',
    reason: 'Attending final round on-site interview and product evaluation.',
    start_date: '2026-10-20',
    end_date: '2026-10-20',
    from_time: '09:00:00',
    to_time: '17:30:00',
    slot_type: 'FULL_DAY',
    total_days: 1,
    venue: 'Zoho Estancia Campus, Guduvanchery, Chennai',
    company_name: 'Zoho Corporation',
    company_role: 'Software Development Intern',
    team_members: [
      { register_number: '714022104153', name: 'Nakshatra S V', role: 'APPLICANT' },
    ],
    document_ids: ['d1234567-89ab-cdef-0123-456789abcdef'],
    documents: [
      {
        id: 'd1234567-89ab-cdef-0123-456789abcdef',
        file_name: 'Zoho_Interview_CallLetter.pdf',
        document_type: 'INTERVIEW_LETTER',
        size: 850000,
      },
    ],
    status: 'PENDING',
    submitted_date: '2026-10-03T14:10:00Z',
    created_at: '2026-10-03T14:10:00Z',
  },
  {
    id: '9b234cd5-6677-8899-00bb-ccddeeff0011',
    code: 'OD-2026-003',
    student_id: 'usr-student-003',
    student_name: 'Vishwanath M',
    student_reg_no: '714022104210',
    department: 'CSE',
    year: 'IV',
    section: 'D',
    purpose: 'PROJECT',
    event_id: null,
    activity_id: 'act-smart-traffic-01',
    event_name: 'Smart Traffic Hardware Deployment',
    reason: 'Field testing sensor hardware at Gandhipuram junction.',
    start_date: '2026-10-22',
    end_date: '2026-10-22',
    from_time: '13:30:00',
    to_time: '16:30:00',
    slot_type: 'AFTERNOON',
    total_days: 0.5,
    venue: 'Gandhipuram Signal 4, Coimbatore',
    team_members: [
      { register_number: '714022104210', name: 'Vishwanath M', role: 'LEAD' },
      { register_number: '714022104032', name: 'Aswin K', role: 'MEMBER' },
    ],
    document_ids: [],
    status: 'REVISION_REQUESTED',
    revision_notes: 'Please attach permission letter from Coimbatore City Traffic Police.',
    submitted_date: '2026-10-02T10:00:00Z',
    created_at: '2026-10-02T10:00:00Z',
  },
];

export const fixturePaginatedODs: PaginatedResponse<ApiODRequest> = {
  data: fixtureApiODs,
  meta: {
    page: 1,
    page_size: 20,
    total: 3,
  },
};

export const fixtureODConflictResponse: ODConflictResponse = {
  has_conflict: false,
  conflicts: [],
};
