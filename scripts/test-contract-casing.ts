/**
 * Contract Casing Verification Suite
 * Asserts that all serializer helpers and route response objects produce strictly snake_case wire formats
 * with ZERO camelCase keys.
 * Fails with non-zero exit code if any camelCase key is detected.
 */

import {
  findCamelCaseKeys,
  serializeActivity,
  serializeDocument,
  serializeEvent,
  serializeNotification,
  serializeODConflict,
  serializeODRequest,
  serializeReportSummary,
  serializeReviewSession,
  serializeSignedUrl,
  serializeStudentRecord,
  serializeWeeklyProgress,
} from '../src/lib/api/serializers';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string, details?: unknown) {
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    if (details) console.error('    Details:', details);
    failed++;
  }
}

console.log('========================================================================');
console.log('CONTRACT CASING VERIFICATION (STRICT SNAKE_CASE WIRE FORMAT)');
console.log('========================================================================\n');

// 1. Verify findCamelCaseKeys detection logic
console.log('--- TEST GROUP 1: findCamelCaseKeys Detection Utility ---');
const positiveCase = {
  studentId: '123',
  nested: {
    eventName: 'Hackathon',
    deep: [{ checkInTime: '10:00' }],
  },
};
const positiveViolations = findCamelCaseKeys(positiveCase);
assert(
  positiveViolations.length === 3 &&
    positiveViolations.includes('studentId') &&
    positiveViolations.includes('nested.eventName') &&
    positiveViolations.includes('nested.deep[0].checkInTime'),
  'findCamelCaseKeys detects all nested camelCase keys correctly'
);

const negativeCase = {
  student_id: '123',
  event_name: 'Hackathon',
  criteria_1_3_2: 42,
  status: 'PENDING',
  nested: {
    team_members: [{ register_number: '7140' }],
  },
};
const negativeViolations = findCamelCaseKeys(negativeCase);
assert(
  negativeViolations.length === 0,
  'findCamelCaseKeys permits snake_case and numerical suffix keys'
);

// 2. Serializers Validation
console.log('\n--- TEST GROUP 2: Serializer Functions Output Zero camelCase ---');

// 2.1 serializeODRequest
const odSerialized = serializeODRequest(
  {
    id: 'od-1',
    student_id: 'std-1',
    student_name: 'Student Name',
    student_reg_no: '714023104088',
    event_name: 'CodeFest',
    purpose: 'HACKATHON',
    reason: 'Attending hackathon',
    start_date: '2026-10-25',
    end_date: '2026-10-26',
    status: 'PENDING',
  },
  {
    team_members: [{ register_number: '714023104089', name: 'Teammate' }],
    documents: [{ id: 'doc-1', file_name: 'proof.pdf', document_type: 'PROOF', size: 1024 }],
    status_history: [{ id: 'h-1', old_status: 'NONE', new_status: 'PENDING', changed_by: 'User' }],
    conflicts: [{ id: 'c-1', od_id: 'od-2', event_name: 'Other', start_date: '2026-10-25', end_date: '2026-10-26' }],
  }
);
const odViolations = findCamelCaseKeys(odSerialized);
assert(
  odViolations.length === 0,
  'serializeODRequest output has ZERO camelCase keys',
  odViolations
);

// 2.2 serializeActivity
const actSerialized = serializeActivity(
  {
    id: 'act-1',
    student_id: 'std-1',
    type: 'PROJECT',
    title: 'AI Portal',
    description: 'Portal desc',
    technologies: ['Next.js', 'PostgreSQL'],
    start_date: '2026-10-01',
    status: 'ACTIVE',
  },
  {
    team_members: [{ register_number: '714023104088', name: 'Lead' }],
    documents: [{ id: 'doc-1', file_name: 'spec.pdf', document_type: 'PROPOSAL', size: 2048 }],
    status_history: [{ id: 'h-1', old_status: 'SUBMITTED', new_status: 'ACTIVE', changed_by: 'HOD' }],
  }
);
const actViolations = findCamelCaseKeys(actSerialized);
assert(
  actViolations.length === 0,
  'serializeActivity output has ZERO camelCase keys',
  actViolations
);

// 2.3 serializeReviewSession
const revSerialized = serializeReviewSession(
  {
    id: 'rev-1',
    activity_id: 'act-1',
    review_number: 1,
    review_type: 'PROJECT_WEEKLY',
    date: '2026-10-28',
    time: '10:00:00',
    venue: 'Lab 3',
    status: 'SCHEDULED',
  },
  {
    attendance: [{ student_id: 'std-1', register_number: '714023104088', attended: true }],
    progress: [{ id: 'p-1', review_session_id: 'rev-1', student_id: 'std-1', completed_this_week: 'Done' }],
    team_members: [{ register_number: '714023104088', name: 'Lead' }],
  }
);
const revViolations = findCamelCaseKeys(revSerialized);
assert(
  revViolations.length === 0,
  'serializeReviewSession output has ZERO camelCase keys',
  revViolations
);

// 2.4 serializeWeeklyProgress
const progSerialized = serializeWeeklyProgress({
  id: 'prog-1',
  review_session_id: 'rev-1',
  student_id: 'std-1',
  completed_this_week: 'Frontend',
  currently_working_on: 'Backend',
  next_week_goal: 'Testing',
  blockers: 'None',
  github_url: 'https://github.com',
  submitted_at: '2026-10-28T10:00:00Z',
});
const progViolations = findCamelCaseKeys(progSerialized);
assert(
  progViolations.length === 0,
  'serializeWeeklyProgress output has ZERO camelCase keys',
  progViolations
);

// 2.5 serializeStudentRecord
const stdSerialized = serializeStudentRecord({
  id: 'std-1',
  user_id: 'usr-1',
  register_number: '714023104088',
  name: 'Meena C',
  department: 'CSE',
  year: 'III',
  section: 'B',
  email: 'meena@siet.ac.in',
  created_at: '2026-08-01T00:00:00Z',
});
const stdViolations = findCamelCaseKeys(stdSerialized);
assert(
  stdViolations.length === 0,
  'serializeStudentRecord output has ZERO camelCase keys',
  stdViolations
);

// 2.6 serializeEvent
const evtSerialized = serializeEvent(
  {
    id: 'evt-1',
    code: 'EVT-2026-001',
    title: 'Hackathon 2026',
    purpose: 'HACKATHON',
    date: '2026-11-01',
    end_date: '2026-11-02',
    venue: 'Convention Center',
    status: 'UPCOMING',
  },
  {
    attached_ods: [{ id: 'od-1', code: 'OD-2026-001', status: 'APPROVED', start_date: '2026-11-01', end_date: '2026-11-02' }],
  }
);
const evtViolations = findCamelCaseKeys(evtSerialized);
assert(
  evtViolations.length === 0,
  'serializeEvent output has ZERO camelCase keys',
  evtViolations
);

// 2.7 serializeDocument & serializeSignedUrl
const docSerialized = serializeDocument({
  id: 'doc-1',
  file_name: 'test.pdf',
  document_type: 'PROOF',
  storage_path: 'od/1/test.pdf',
  size: 512,
  owner: 'od_request',
  owner_id: 'od-1',
  uploaded_by: 'usr-1',
  created_at: '2026-10-21T00:00:00Z',
});
const docViolations = findCamelCaseKeys(docSerialized);
assert(
  docViolations.length === 0,
  'serializeDocument output has ZERO camelCase keys',
  docViolations
);

const signedSerialized = serializeSignedUrl(docSerialized, 'https://signed-url.com', 900);
const signedViolations = findCamelCaseKeys(signedSerialized);
assert(
  signedViolations.length === 0,
  'serializeSignedUrl output has ZERO camelCase keys',
  signedViolations
);

// 2.8 serializeNotification
const notifSerialized = serializeNotification({
  id: 'notif-1',
  user_id: 'usr-1',
  title: 'Test Notification',
  message: 'Details',
  type: 'OD_UPDATE',
  is_read: false,
  link_url: '/student/od-requests',
  created_at: '2026-10-21T00:00:00Z',
});
const notifViolations = findCamelCaseKeys(notifSerialized);
assert(
  notifViolations.length === 0,
  'serializeNotification output has ZERO camelCase keys',
  notifViolations
);

// 2.9 serializeODConflict
const conflictSerialized = serializeODConflict({
  od_id: 'od-1',
  code: 'OD-2026-001',
  event_name: 'Workshop',
  purpose: 'WORKSHOP',
  start_date: '2026-10-25',
  end_date: '2026-10-26',
  status: 'APPROVED',
  student_name: 'Student',
  register_number: '714023104088',
});
const conflictViolations = findCamelCaseKeys(conflictSerialized);
assert(
  conflictViolations.length === 0,
  'serializeODConflict output has ZERO camelCase keys',
  conflictViolations
);

// 2.10 serializeReportSummary
const repSerialized = serializeReportSummary({
  total_students: 120,
  active_ods: 15,
  total_activities: 30,
  upcoming_reviews: 8,
  students: { total: 120, by_year: { I: 30, II: 30, III: 30, IV: 30 }, by_section: { A: 60, B: 60 } },
  od_requests: { total: 40, pending: 10, approved: 25, rejected: 5, revision_requested: 0, total_approved_days: 50 },
  activities: { total: 30, projects: 15, hackathons: 10, internships: 5, status_breakdown: { submitted: 5, active: 20, rejected: 2, revision_requested: 1, completed: 2 } },
  reviews: { total: 20, scheduled: 8, completed: 12, total_attended_count: 55 },
  events: { total: 5, upcoming: 2, ongoing: 1, completed: 2 },
});
const repViolations = findCamelCaseKeys(repSerialized);
assert(
  repViolations.length === 0,
  'serializeReportSummary output has ZERO camelCase keys',
  repViolations
);

// 3. Static Route Analysis: Search for camelCase keys in apiSuccess payloads across src/app/api/v1/
console.log('\n--- TEST GROUP 3: Static Route Response Analysis ---');
const routesDir = path.resolve(process.cwd(), 'src/app/api/v1');

function getRouteFiles(dir: string): string[] {
  let files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getRouteFiles(fullPath));
    } else if (entry.isFile() && entry.name === 'route.ts') {
      files.push(fullPath);
    }
  }
  return files;
}

const routeFiles = getRouteFiles(routesDir);
assert(routeFiles.length >= 20, `Found ${routeFiles.length} API route.ts files to inspect`);

// Known camelCase payload keys that were previously returned in routes
const forbiddenCamelCaseKeys = [
  'studentId',
  'studentName',
  'studentRegNo',
  'eventId',
  'activityId',
  'eventName',
  'startDate',
  'endDate',
  'fromTime',
  'toTime',
  'slotType',
  'totalDays',
  'registrationId',
  'additionalNotes',
  'rejectionReason',
  'revisionNotes',
  'submittedDate',
  'approvedDate',
  'fileName',
  'documentType',
  'storagePath',
  'ownerId',
  'uploadedBy',
  'createdAt',
  'updatedAt',
  'qrToken',
  'qrExpiresAt',
  'expiresInSeconds',
  'sessionCount',
  'reviewNumber',
  'reviewType',
  'activityTitle',
  'activityType',
  'checkInTime',
  'completedWork',
  'currentWork',
  'nextSteps',
  'conflictType',
  'hasConflict',
  'conflictCount',
  'conflictingRequests',
  'teamMembers',
  'statusHistory',
  'progressReports',
  'attachedODs',
  'userId',
  'registerNumber',
  'regNo',
  'isRead',
  'linkUrl',
];

let routeViolationsCount = 0;
for (const file of routeFiles) {
  const relPath = path.relative(process.cwd(), file);
  const content = fs.readFileSync(file, 'utf-8');

  // Check if any forbidden camelCase key appears as an object property key in apiSuccess
  const matchedKeys: string[] = [];
  for (const key of forbiddenCamelCaseKeys) {
    // Regex matches: "key:" followed by non-newline, inside object literals
    const keyRegex = new RegExp(`\\b${key}\\s*:`, 'g');
    if (keyRegex.test(content)) {
      matchedKeys.push(key);
    }
  }

  if (matchedKeys.length > 0) {
    console.error(`  ✗ Route ${relPath} contains camelCase keys in responses:`, matchedKeys);
    routeViolationsCount++;
  }
}

assert(
  routeViolationsCount === 0,
  'All route.ts files return ZERO forbidden camelCase response keys',
  { routeViolationsCount }
);

console.log('\n------------------------------------------------');
console.log(`TOTAL CASING TESTS: ${passed + failed}`);
console.log(`PASSED:             ${passed}`);
console.log(`FAILED:             ${failed}`);
console.log('------------------------------------------------\n');

if (failed > 0) {
  console.error('>>> CONTRACT CASING VERIFICATION: FAILED <<<');
  process.exit(1);
} else {
  console.log('>>> CONTRACT CASING VERIFICATION: ALL PASSED <<<');
  process.exit(0);
}
