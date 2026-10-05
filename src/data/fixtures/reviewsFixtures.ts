/**
 * Contract-Compatible Fixtures: Weekly Reviews Domain
 * Conforms 100% to API Contract v2.0 & PRD §5.3 (Non-Evaluative)
 */

import {
  ApiReviewSession,
  GenerateQrResponse,
  PaginatedResponse,
  ReviewCheckInResponse,
} from '@/types/contract';

export const fixtureApiReviews: ApiReviewSession[] = [
  {
    id: 'rev-sess-001',
    code: 'REV-2026-001',
    activity_id: 'act-exam-monitor-01',
    activity_title: 'AI-Based Examination Monitoring System',
    activity_type: 'PROJECT',
    review_type: 'PROJECT_WEEKLY',
    review_number: 1,
    date: '2026-09-25',
    time: '14:00:00',
    venue: 'CSE Lab 2',
    status: 'COMPLETED',
    faculty_reviewer: 'Dr. Priya Kumar',
    student_team: [
      { register_number: '714023104088', name: 'Meena C', role: 'Team Lead', email: 'meena.23cse@siet.ac.in' },
      { register_number: '714022104153', name: 'Nakshatra S V', role: 'Backend', email: 'nakshatra.22cse@siet.ac.in' },
    ],
    progress: {
      id: 'prog-001',
      review_session_id: 'rev-sess-001',
      student_id: 'usr-student-001',
      completed_this_week: 'Configured Supabase schema with RLS and imported initial classroom test footage.',
      currently_working_on: 'Multi-person object tracking and latency optimization across frames.',
      next_week_goal: 'Deploy webcam capture pipeline and evaluate proctoring dashboard in lab.',
      blockers: 'Camera angle variations produce false device occlusion positives.',
      github_url: 'https://github.com/meena-c/ai-exam-monitor/commit/89f2a1b',
      submitted_at: '2026-09-24T18:45:00Z',
    },
    attendance: [
      { student_id: 'usr-student-001', name: 'Meena C', register_number: '714023104088', attended: true, check_in_time: '13:55:00' },
      { student_id: 'usr-student-002', name: 'Nakshatra S V', register_number: '714022104153', attended: true, check_in_time: '13:58:00' },
    ],
    meeting_notes: 'Demonstrated initial pipeline latency. Advised on focal length adjustments.',
    next_week_goal: 'Finalize tracking persistence before laboratory trial.',
    qr_code_token: 'QR-REV-001-TOKEN-EXPIRING-SECURE',
    created_at: '2026-09-22T14:15:00Z',
  },
  {
    id: 'rev-sess-002',
    code: 'REV-2026-002',
    activity_id: 'act-exam-monitor-01',
    activity_title: 'AI-Based Examination Monitoring System',
    activity_type: 'PROJECT',
    review_type: 'PROJECT_WEEKLY',
    review_number: 2,
    date: '2026-10-02',
    time: '14:00:00',
    venue: 'CSE Lab 2',
    status: 'SCHEDULED',
    faculty_reviewer: 'Dr. Priya Kumar',
    student_team: [
      { register_number: '714023104088', name: 'Meena C', role: 'Team Lead', email: 'meena.23cse@siet.ac.in' },
      { register_number: '714022104153', name: 'Nakshatra S V', role: 'Backend', email: 'nakshatra.22cse@siet.ac.in' },
    ],
    attendance: [
      { student_id: 'usr-student-001', name: 'Meena C', register_number: '714023104088', attended: false },
      { student_id: 'usr-student-002', name: 'Nakshatra S V', register_number: '714022104153', attended: false },
    ],
    qr_code_token: 'QR-REV-002-DYNAMIC-HMAC-TOKEN',
    created_at: '2026-09-22T14:15:00Z',
  },
];

export const fixturePaginatedReviews: PaginatedResponse<ApiReviewSession> = {
  data: fixtureApiReviews,
  meta: {
    page: 1,
    page_size: 20,
    total: 2,
  },
};

export const fixtureGenerateQrResponse: GenerateQrResponse = {
  token: 'HMAC_SHA256_DYNAMIC_TOKEN_20261005_REV002',
  expires_at: '2026-10-05T14:30:00Z',
  session_id: 'rev-sess-002',
};

export const fixtureCheckInResponse: ReviewCheckInResponse = {
  success: true,
  check_in_time: '2026-10-05T14:02:18Z',
  student_id: 'usr-student-001',
  register_number: '714023104088',
};
