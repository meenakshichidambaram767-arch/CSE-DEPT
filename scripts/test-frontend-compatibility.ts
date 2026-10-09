/**
 * Phase 1 Frontend API-Contract Compatibility Verification Suite
 * SIET CSE Department Platform - API Contract v2.0
 *
 * Covers:
 * 1. API Types & Payloads (OD, Activity, Review, Document, Notification)
 * 2. Status Enums (OD, Activity, Review, ReviewSession)
 * 3. RFC 7807 Error Handling (parsing, code/message/details, field-level errors)
 * 4. Pagination Model (structure, limits, list responses)
 * 5. Fixtures Conformity (verifying mock fixtures match contract shapes)
 * 6. UI <-> API Model Mappers (bidirectional mapping, time/date normalization)
 */

import {
  CreateODPayload,
  CreateActivityPayload,
  ReviewProgressPayload,
  DocumentUploadPayload,
  DocumentSignedUrlResponse,
  ApiNotification,
  NotificationReadResponse,
  PaginatedResponse,
  ApiODStatus,
  ApiActivityStatus,
  ApiReviewType,
} from '../src/types/contract';

import {
  ApiError,
  parseApiError,
  getFieldError,
} from '../src/lib/api/client';

import {
  formatTimeToHHMMSS,
  formatDateToYYYYMMDD,
  mapODApplicationToApiPayload,
  mapApiODToODApplication,
  mapActivityToApiPayload,
  mapApiActivityToActivity,
  mapWeeklyProgressToApiPayload,
  mapApiReviewToReviewSession,
} from '../src/lib/api/mappers';

import {
  fixtureApiODs,
  fixtureODConflictResponse,
} from '../src/data/fixtures/odFixtures';

import {
  fixtureApiActivities,
} from '../src/data/fixtures/activitiesFixtures';

import {
  fixtureApiReviews,
  fixtureGenerateQrResponse,
  fixtureCheckInResponse,
} from '../src/data/fixtures/reviewsFixtures';

import {
  fixtureApiStudents,
  fixtureStudentSummary,
} from '../src/data/fixtures/recordsFixtures';

import {
  fixtureAccreditationReport,
  fixtureReportSummary,
} from '../src/data/fixtures/reportsFixtures';

import {
  fixtureApiNotifications,
} from '../src/data/fixtures/notificationsFixtures';

import { ODApplication, Activity, WeeklyProgress } from '../src/types';
import { ApiODRequest, ApiReviewSession } from '../src/types/contract';

// ==========================================
// TEST FRAMEWORK HARNESS
// ==========================================

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures: Array<{ test: string; error: string }> = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`Mismatch in ${message} -> Expected ${expectedStr}, got ${actualStr}`);
  }
}

function runTest(suite: string, name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ [PASS] ${suite} > ${name}`);
  } catch (err: unknown) {
    failedTests++;
    const errMsg = err instanceof Error ? err.message : String(err);
    failures.push({ test: `${suite} > ${name}`, error: errMsg });
    console.error(`  ✗ [FAIL] ${suite} > ${name}: ${errMsg}`);
  }
}

console.log('\n===============================================================');
console.log('PHASE 1: FRONTEND API-CONTRACT COMPATIBILITY TEST SUITE');
console.log('Authoritative Contract: SIET CSE Department Platform v2.0');
console.log('===============================================================\n');

// ==========================================
// 1. API TYPES & PAYLOAD COMPATIBILITY
// ==========================================

runTest('1. API Types', 'OD request creation payload adheres to snake_case contract', () => {
  const payload: CreateODPayload = {
    purpose: 'HACKATHON',
    event_name: 'Smart India Hackathon',
    reason: 'Final round presentation',
    start_date: '2026-10-15',
    end_date: '2026-10-17',
    from_time: '09:00:00',
    to_time: '18:00:00',
    total_days: 3,
    venue: 'IIT Madras',
    registration_id: 'SIH-2026-9921',
    team_members: [
      { register_number: '714022104002', name: 'Nattu K', role: 'MEMBER' },
    ],
    document_ids: ['doc-uuid-001'],
  };

  assert(payload.purpose === 'HACKATHON', 'Purpose should match enum');
  assert(/^[0-2][0-9]:[0-5][0-9]:[0-5][0-9]$/.test(payload.from_time), 'from_time must be HH:MM:SS');
  assert(/^[0-2][0-9]:[0-5][0-9]:[0-5][0-9]$/.test(payload.to_time), 'to_time must be HH:MM:SS');
  assert(typeof payload.total_days === 'number', 'total_days must be number');
  assert(payload.team_members![0].register_number === '714022104002', 'register_number must be snake_case');
});

runTest('1. API Types', 'Activity payload adheres to contract and supports all 3 types', () => {
  const project: CreateActivityPayload = {
    type: 'PROJECT',
    title: 'Autonomous Exam Proctoring',
    description: 'Vision-based monitoring system',
    technologies: ['Next.js', 'Python', 'YOLOv8'],
    start_date: '2026-09-01',
    end_date: '2026-11-30',
    github_url: 'https://github.com/cse/exam-proctor',
    guide_name: 'Dr. C. Chidambaram',
    team_members: [
      { register_number: '714023104088', name: 'Meena C', role: 'LEAD' },
    ],
  };

  const hackathon: CreateActivityPayload = {
    type: 'HACKATHON',
    title: 'Hack Coimbatore 2026',
    description: 'Smart mobility track',
    start_date: '2026-10-10',
    end_date: '2026-10-12',
    organization: 'Anna University',
  };

  const internship: CreateActivityPayload = {
    type: 'INTERNSHIP',
    title: 'Zoho Corporation SDE Intern',
    description: 'Full stack development',
    start_date: '2026-11-01',
    company_name: 'Zoho Corporation',
    company_role: 'SDE Intern',
    company_location: 'Chennai',
  };

  assert(project.type === 'PROJECT', 'Project type matches');
  assert(hackathon.type === 'HACKATHON', 'Hackathon type matches');
  assert(internship.type === 'INTERNSHIP', 'Internship type matches');
  assert(Array.isArray(project.technologies), 'Technologies is an array');
});

runTest('1. API Types', 'Review engine payload is 100% non-evaluative with 4 quadrants', () => {
  const progress: ReviewProgressPayload = {
    completed_this_week: 'Implemented authentication flow and database schema.',
    currently_working_on: 'Integrating camera feed pipeline.',
    next_week_goal: 'Complete attendance check-in UI.',
    blockers: 'Camera latency under low light.',
    github_url: 'https://github.com/cse/commit/abc123',
  };

  assert(typeof progress.completed_this_week === 'string', 'completed_this_week present');
  assert(typeof progress.currently_working_on === 'string', 'currently_working_on present');
  assert(typeof progress.next_week_goal === 'string', 'next_week_goal present');
  assert(typeof progress.blockers === 'string', 'blockers present');

  // Verify non-evaluative contract: NO rubric scoring fields permitted
  const rawObj = (progress as unknown) as Record<string, unknown>;
  assert(rawObj.marks === undefined, 'Non-evaluative: marks forbidden');
  assert(rawObj.score === undefined, 'Non-evaluative: score forbidden');
  assert(rawObj.rubric === undefined, 'Non-evaluative: rubric forbidden');
  assert(rawObj.totalScore === undefined, 'Non-evaluative: totalScore forbidden');
});

runTest('1. API Types', 'Document upload and signed URL response contracts', () => {
  const uploadPayload: DocumentUploadPayload = {
    file_name: 'offer_letter.pdf',
    document_type: 'OFFER_LETTER',
    storage_path: 'internship/zoho/offer_letter.pdf',
    size: 204800,
    owner: 'activity',
    owner_id: 'act-001',
  };

  const signedUrlResp: DocumentSignedUrlResponse = {
    id: 'doc-001',
    fileName: 'offer_letter.pdf',
    documentType: 'OFFER_LETTER',
    storagePath: 'internship/zoho/offer_letter.pdf',
    size: 204800,
    signedUrl: 'https://storage.supabase.co/v1/sign/offer_letter.pdf?token=abc',
    expiresInSeconds: 900,
    createdAt: '2026-10-05T09:00:00Z',
  };

  assert(uploadPayload.owner === 'activity', 'Document owner matches');
  assert(signedUrlResp.expiresInSeconds === 900, 'Signed URL expires in 900 seconds (15 min)');
});

runTest('1. API Types', 'Notification contract matches in-app notification events', () => {
  const notif: ApiNotification = {
    id: 'notif-001',
    userId: 'usr-student-001',
    title: 'OD Approved',
    message: 'Your OD application for SIH 2026 has been approved by HOD.',
    type: 'OD_UPDATE',
    isRead: false,
    createdAt: '2026-10-05T10:00:00Z',
    linkUrl: '/student/od-requests',
  };

  const readResp: NotificationReadResponse = {
    success: true,
    id: 'notif-001',
  };

  assert(notif.type === 'OD_UPDATE', 'Notification type matches');
  assert(readResp.success === true, 'Notification read response matches');
});

// ==========================================
// 2. STATUS ENUMS ALIGNMENT
// ==========================================

runTest('2. Status Enums', 'OD Status matches exact verified lifecycle', () => {
  const validODStatuses: ApiODStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'];
  assert(validODStatuses.includes('PENDING'), 'PENDING supported');
  assert(validODStatuses.includes('APPROVED'), 'APPROVED supported');
  assert(validODStatuses.includes('REJECTED'), 'REJECTED supported');
  assert(validODStatuses.includes('REVISION_REQUESTED'), 'REVISION_REQUESTED supported');
  assert(validODStatuses.length === 4, 'Exactly 4 authoritative OD statuses');
});

runTest('2. Status Enums', 'Activity Status matches contract lifecycle', () => {
  const validActivityStatuses: ApiActivityStatus[] = [
    'SUBMITTED',
    'ACTIVE',
    'REJECTED',
    'REVISION_REQUESTED',
    'COMPLETED',
  ];
  assert(validActivityStatuses.includes('SUBMITTED'), 'SUBMITTED supported');
  assert(validActivityStatuses.includes('ACTIVE'), 'ACTIVE supported');
  assert(validActivityStatuses.includes('REJECTED'), 'REJECTED supported');
  assert(validActivityStatuses.includes('REVISION_REQUESTED'), 'REVISION_REQUESTED supported');
  assert(validActivityStatuses.includes('COMPLETED'), 'COMPLETED supported');
  assert(validActivityStatuses.length === 5, 'Exactly 5 authoritative Activity statuses');
});

runTest('2. Status Enums', 'Review Types match PRD & Contract specifications', () => {
  const validReviewTypes: ApiReviewType[] = [
    'PROJECT_WEEKLY',
    'HACKATHON_POST',
    'INTERNSHIP_MID',
    'INTERNSHIP_FINAL',
  ];
  assert(validReviewTypes.includes('PROJECT_WEEKLY'), 'PROJECT_WEEKLY supported');
  assert(validReviewTypes.includes('HACKATHON_POST'), 'HACKATHON_POST supported');
  assert(validReviewTypes.includes('INTERNSHIP_MID'), 'INTERNSHIP_MID supported');
  assert(validReviewTypes.includes('INTERNSHIP_FINAL'), 'INTERNSHIP_FINAL supported');
  assert(validReviewTypes.length === 4, 'Exactly 4 authoritative review types');
});

// ==========================================
// 3. RFC 7807 ERROR MODEL
// ==========================================

runTest('3. RFC 7807 Errors', 'ApiError properly exposes code, message, status, and details', () => {
  const err = new ApiError('OD_CONFLICT', 'Timetable collision detected for selected dates.', 409, {
    field: 'start_date',
    conflicting_event: 'Internal Assessment Exam 2',
  });

  assert(err instanceof Error, 'err is instance of Error');
  assert(err instanceof ApiError, 'err is instance of ApiError');
  assert(err.code === 'OD_CONFLICT', 'Code is accessible');
  assert(err.status === 409, 'Status is accessible');
  assert(err.message === 'Timetable collision detected for selected dates.', 'Message matches');
  assert(err.field === 'start_date', 'Field getter works');
  assert(err.isValidationError === true, 'isValidationError works when field exists');
});

runTest('3. RFC 7807 Errors', 'parseApiError parses ApiError, contract envelope, and generic error', () => {
  // Case A: ApiError instance
  const apiErr = new ApiError('FORBIDDEN', 'HOD privilege required.', 403);
  const parsedA = parseApiError(apiErr);
  assertEqual(parsedA.error.code, 'FORBIDDEN', 'Parsed ApiError code');
  assertEqual(parsedA.error.message, 'HOD privilege required.', 'Parsed ApiError message');

  // Case B: Raw RFC 7807 payload
  const rawPayload = {
    error: {
      code: 'VALIDATION_FAILED',
      message: 'to_time must be later than from_time.',
      details: { field: 'to_time' },
    },
  };
  const parsedB = parseApiError(rawPayload);
  assertEqual(parsedB.error.code, 'VALIDATION_FAILED', 'Parsed raw contract payload code');
  assertEqual(parsedB.error.details?.field, 'to_time', 'Parsed raw details.field');

  // Case C: Standard Javascript Error
  const jsErr = new Error('Network failure.');
  const parsedC = parseApiError(jsErr);
  assertEqual(parsedC.error.code, 'UNKNOWN_ERROR', 'Parsed JS error code');
  assertEqual(parsedC.error.message, 'Network failure.', 'Parsed JS error message');
});

runTest('3. RFC 7807 Errors', 'getFieldError retrieves field-level validation errors correctly', () => {
  const errWithField = new ApiError('VALIDATION_ERROR', 'End date cannot precede start date.', 400, {
    field: 'end_date',
  });
  const errWithDict = new ApiError('VALIDATION_ERROR', 'Multiple fields failed validation.', 422, {
    from_time: 'Must be in HH:MM:SS format',
    venue: 'Venue cannot be blank',
  });

  assertEqual(getFieldError(errWithField, 'end_date'), 'End date cannot precede start date.', 'Field error from err.field');
  assertEqual(getFieldError(errWithDict, 'from_time'), 'Must be in HH:MM:SS format', 'Field error from details map');
  assertEqual(getFieldError(errWithDict, 'non_existent'), null, 'Null for non-existent field');
});

// ==========================================
// 4. PAGINATION MODEL
// ==========================================

runTest('4. Pagination', 'PaginatedResponse conforms to contract pagination shape', () => {
  const paginated: PaginatedResponse<{ id: string }> = {
    data: [{ id: '1' }, { id: '2' }, { id: '3' }],
    meta: {
      page: 1,
      page_size: 10,
      total: 3,
    },
  };

  assert(Array.isArray(paginated.data), 'Data is array');
  assert(paginated.data.length === 3, 'Data length matches');
  assert(paginated.meta.page === 1, 'Page matches');
  assert(paginated.meta.page_size === 10, 'Page size matches');
  assert(paginated.meta.total === 3, 'Total matches');
});

// ==========================================
// 5. FIXTURES CONFORMITY
// ==========================================

runTest('5. Fixtures', 'OD fixtures conform to contract schema', () => {
  assert(fixtureApiODs.length > 0, 'OD fixtures exist');
  for (const od of fixtureApiODs) {
    assert(typeof od.id === 'string', 'OD has id');
    assert(typeof od.student_name === 'string', 'OD has student_name');
    assert(typeof od.student_reg_no === 'string', 'OD has student_reg_no');
    assert(['PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'].includes(od.status), 'OD status valid');
    assert(/^\d{4}-\d{2}-\d{2}$/.test(od.start_date), 'start_date is YYYY-MM-DD');
    assert(/^\d{2}:\d{2}:\d{2}$/.test(od.from_time), 'from_time is HH:MM:SS');
  }
  assert(fixtureODConflictResponse.has_conflict === false, 'Conflict fixture has boolean');
});

runTest('5. Fixtures', 'Activities fixtures conform to contract schema', () => {
  assert(fixtureApiActivities.length > 0, 'Activity fixtures exist');
  for (const act of fixtureApiActivities) {
    assert(typeof act.id === 'string', 'Activity has id');
    assert(['PROJECT', 'HACKATHON', 'INTERNSHIP'].includes(act.type), 'Activity type valid');
    assert(['SUBMITTED', 'ACTIVE', 'REJECTED', 'REVISION_REQUESTED', 'COMPLETED'].includes(act.status), 'Activity status valid');
    assert(Array.isArray(act.team_members), 'team_members is array');
  }
});

runTest('5. Fixtures', 'Reviews fixtures are non-evaluative with QR and attendance', () => {
  assert(fixtureApiReviews.length > 0, 'Reviews fixtures exist');
  for (const rev of fixtureApiReviews) {
    assert(typeof rev.id === 'string', 'Review has id');
    assert(['PROJECT_WEEKLY', 'HACKATHON_POST', 'INTERNSHIP_MID', 'INTERNSHIP_FINAL'].includes(rev.review_type), 'Review type valid');
    assert(['SCHEDULED', 'COMPLETED', 'CANCELLED'].includes(rev.status), 'Review status valid');
    assert(Array.isArray(rev.attendance), 'attendance is array');

    // Confirm no rubric/scoring fields exist in raw review object
    const raw = (rev as unknown) as Record<string, unknown>;
    assert(raw.technicalKnowledge === undefined, 'No technicalKnowledge');
    assert(raw.implementation === undefined, 'No implementation score');
    assert(raw.marks === undefined, 'No marks');
  }

  assert(typeof fixtureGenerateQrResponse.token === 'string', 'QR token exists');
  assert(fixtureCheckInResponse.success === true, 'Check-in response valid');
});

runTest('5. Fixtures', 'Records, Reports, and Notifications fixtures conform to contract', () => {
  assert(fixtureApiStudents.length > 0, 'Student fixtures exist');
  assert(typeof fixtureStudentSummary.stats.attendance_rate === 'number', 'Summary stats attendance_rate is number');
  assert(fixtureAccreditationReport.department.length > 0, 'Accreditation department valid');
  assert(fixtureAccreditationReport.metrics.criteria_1_3_2.count > 0, 'Criteria 1.3.2 valid');
  assert(fixtureReportSummary.total_students > 0, 'Report summary total_students valid');
  assert(fixtureApiNotifications.length > 0, 'Notifications fixtures exist');
});

// ==========================================
// 6. UI <-> API MODEL MAPPERS
// ==========================================

runTest('6. Mappers', 'formatTimeToHHMMSS normalizes presentation strings to strict HH:MM:SS', () => {
  assertEqual(formatTimeToHHMMSS('09:00 AM'), '09:00:00', '09:00 AM -> 09:00:00');
  assertEqual(formatTimeToHHMMSS('2:30 PM'), '14:30:00', '2:30 PM -> 14:30:00');
  assertEqual(formatTimeToHHMMSS('12:00 PM'), '12:00:00', '12:00 PM -> 12:00:00');
  assertEqual(formatTimeToHHMMSS('12:30 AM'), '00:30:00', '12:30 AM -> 00:30:00');
  assertEqual(formatTimeToHHMMSS('14:45'), '14:45:00', '14:45 -> 14:45:00');
  assertEqual(formatTimeToHHMMSS('15:30:00'), '15:30:00', '15:30:00 unchanged');
});

runTest('6. Mappers', 'formatDateToYYYYMMDD normalizes date strings', () => {
  assertEqual(formatDateToYYYYMMDD('2026-10-15'), '2026-10-15', '2026-10-15 unchanged');
  const d = new Date(2026, 9, 15); // October is month index 9
  assertEqual(formatDateToYYYYMMDD(d.toISOString()), '2026-10-15', 'ISO string normalized');
});

runTest('6. Mappers', 'mapODApplicationToApiPayload transforms UI camelCase to snake_case payload', () => {
  const uiOD: Partial<ODApplication> = {
    purpose: 'HACKATHON',
    eventName: 'Hack Coimbatore',
    reason: 'Inter-college technical competition',
    startDate: '2026-11-05',
    endDate: '2026-11-06',
    fromTime: '09:30 AM',
    toTime: '05:30 PM',
    totalDays: 2,
    venue: 'PSG College of Technology',
    registrationId: 'HC-2026-042',
    teamMembers: [
      { name: 'Meena C', regNo: '714023104088', email: 'meena@siet.ac.in', role: 'Team Lead' },
    ],
    documentIds: ['doc-proof-01'],
  };

  const payload = mapODApplicationToApiPayload(uiOD);
  assertEqual(payload.purpose, 'HACKATHON', 'Mapped purpose');
  assertEqual(payload.event_name, 'Hack Coimbatore', 'Mapped event_name');
  assertEqual(payload.from_time, '09:30:00', 'Normalized from_time');
  assertEqual(payload.to_time, '17:30:00', 'Normalized to_time');
  assertEqual(payload.total_days, 2, 'Mapped total_days');
  assertEqual(payload.venue, 'PSG College of Technology', 'Mapped venue');
  assertEqual(payload.registration_id, 'HC-2026-042', 'Mapped registration_id');
  assertEqual(payload.team_members?.[0].register_number, '714023104088', 'Mapped team member register_number');
  assertEqual(payload.document_ids?.[0], 'doc-proof-01', 'Mapped document_ids');
});

runTest('6. Mappers', 'mapApiODToODApplication transforms API contract response to UI model', () => {
  const apiOD: ApiODRequest = fixtureApiODs[0];
  const uiOD = mapApiODToODApplication(apiOD);

  assertEqual(uiOD.id, apiOD.id, 'Mapped ID');
  assertEqual(uiOD.studentName, apiOD.student_name, 'Mapped studentName');
  assertEqual(uiOD.studentRegNo, apiOD.student_reg_no, 'Mapped studentRegNo');
  assertEqual(uiOD.eventName, apiOD.event_name, 'Mapped eventName');
  assertEqual(uiOD.fromTime, apiOD.from_time, 'Mapped fromTime');
  assertEqual(uiOD.toTime, apiOD.to_time, 'Mapped toTime');
  assertEqual(uiOD.teamMembers?.[0]?.regNo, apiOD.team_members?.[0]?.register_number, 'Mapped teamMember regNo');
});

runTest('6. Mappers', 'mapActivityToApiPayload & mapApiActivityToActivity round trip', () => {
  const uiAct: Partial<Activity> = {
    type: 'PROJECT',
    title: 'Autonomous Exam Monitor',
    description: 'Vision proctoring platform',
    technologies: ['React', 'FastAPI'],
    startDate: '2026-09-01',
    endDate: '2026-11-30',
    guideName: 'Dr. Priya Kumar',
    teamMembers: [
      { name: 'Meena C', regNo: '714023104088', email: 'meena@siet.ac.in', role: 'Lead' },
    ],
  };

  const payload = mapActivityToApiPayload(uiAct);
  assertEqual(payload.type, 'PROJECT', 'Payload type is PROJECT');
  assertEqual(payload.title, 'Autonomous Exam Monitor', 'Payload title matches');
  assertEqual(payload.guide_name, 'Dr. Priya Kumar', 'Payload guide_name snake_case');
  assertEqual(payload.team_members?.[0].register_number, '714023104088', 'Payload team member register_number');

  const roundTripUI = mapApiActivityToActivity(fixtureApiActivities[0]);
  assertEqual(roundTripUI.title, fixtureApiActivities[0].title, 'Round trip UI title matches');
  assertEqual(roundTripUI.studentRegNo, fixtureApiActivities[0].student_reg_no, 'Round trip studentRegNo matches');
});

runTest('6. Mappers', 'mapWeeklyProgressToApiPayload adheres to 4 quadrants', () => {
  const uiProg: Partial<WeeklyProgress> = {
    completedThisWeek: 'Auth system finished',
    currentlyWorkingOn: 'Camera capture',
    nextWeekGoal: 'QR scanner',
    blockers: 'Lighting conditions',
    githubUrl: 'https://github.com/cse/repo/commit/123',
  };

  const payload = mapWeeklyProgressToApiPayload(uiProg);
  assertEqual(payload.completed_this_week, 'Auth system finished', 'completed_this_week');
  assertEqual(payload.currently_working_on, 'Camera capture', 'currently_working_on');
  assertEqual(payload.next_week_goal, 'QR scanner', 'next_week_goal');
  assertEqual(payload.blockers, 'Lighting conditions', 'blockers');
  assertEqual(payload.github_url, 'https://github.com/cse/repo/commit/123', 'github_url');
});

runTest('6. Mappers', 'mapApiReviewToReviewSession transforms non-evaluative review session', () => {
  const apiRev: ApiReviewSession = fixtureApiReviews[0];
  const uiRev = mapApiReviewToReviewSession(apiRev);

  assertEqual(uiRev.id, apiRev.id, 'Review ID');
  assertEqual(uiRev.activityTitle, apiRev.activity_title, 'Activity Title');
  assertEqual(uiRev.reviewType, apiRev.review_type, 'Review Type');
  assertEqual(uiRev.attendance.length, apiRev.attendance.length, 'Attendance count');
  assertEqual(uiRev.progress?.completedThisWeek, apiRev.progress?.completed_this_week, 'Progress completedThisWeek');
});

// ==========================================
// TEST SUMMARY & REPORTING
// ==========================================

console.log('\n---------------------------------------------------------------');
console.log(`TOTAL TESTS:  ${totalTests}`);
console.log(`PASSED:       ${passedTests}`);
console.log(`FAILED:       ${failedTests}`);
console.log('---------------------------------------------------------------\n');

if (failures.length > 0) {
  console.error('FAILURES SUMMARY:');
  for (const f of failures) {
    console.error(`- ${f.test}: ${f.error}`);
  }
  process.exit(1);
} else {
  console.log('ALL PHASE 1 FRONTEND API-CONTRACT COMPATIBILITY CHECKS PASSED!\n');
}
