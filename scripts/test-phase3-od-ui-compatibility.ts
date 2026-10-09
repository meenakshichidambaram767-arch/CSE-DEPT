/**
 * Phase 3 Existing OD UI API-Contract Compatibility Test Suite
 * SIET CSE Department Platform - API Contract v2.0
 *
 * Verifies:
 * A. Route Consolidation (/student/apply-od canonical, /student/od-requests/new compatibility forwarder)
 * B. OD Payload Structure (snake_case, IDs, purpose, dates, times, total_days, venue, registration_id, team_members, document_ids)
 * C. Time Handling (Presets: Full Day, Forenoon, Afternoon, Custom Period, HH:MM:SS normalization)
 * D. Date Handling & Total Days (single-day, multi-day, same start/end, YYYY-MM-DD normalization)
 * E. Team Member Structure (register_number, name, role)
 * F. Document References (document_ids UUID array, no filename strings in contract payload)
 * G. OD Conflict Detection (odApi.getODConflicts mock contract resolution, no live network)
 * H. Revision & Resubmission Loop (REVISION_REQUESTED -> edit -> resubmit -> PENDING)
 * I. HOD Decision Lifecycle (PENDING -> APPROVED, REJECTED, REVISION_REQUESTED with notes/reasons)
 * J. RFC 7807 Error Propagation in OD UI
 */

import fs from 'fs';
import path from 'path';
import {
  ApiError,
  parseApiError,
  getFieldError,
} from '../src/lib/api/client';
import {
  odApi,
} from '../src/lib/api/odApi';
import {
  mapODApplicationToApiPayload,
  mapApiODToODApplication,
  formatTimeToHHMMSS,
  formatDateToYYYYMMDD,
  calculateTotalDays,
} from '../src/lib/api/mappers';
import {
  fixtureApiODs,
} from '../src/data/fixtures/odFixtures';
import {
  ODApplication,
} from '../src/types';
import {
  ApiODStatus,
  CreateODPayload,
  ResubmitODPayload,
} from '../src/types/contract';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ [FAIL] ${testName}`);
    if (failureDetails) {
      console.error(`    Details: ${failureDetails}`);
    }
  }
}

async function runPhase3Tests() {
  console.log('\n===============================================================');
  console.log('PHASE 3: EXISTING OD UI API-CONTRACT COMPATIBILITY TEST SUITE');
  console.log('Authoritative Contract: SIET CSE Department Platform v2.0');
  console.log('===============================================================\n');

  // ==========================================
  // CATEGORY A: ROUTE CONSOLIDATION
  // ==========================================
  const applyOdPath = path.resolve(process.cwd(), 'src/app/student/apply-od/page.tsx');
  const newOdPath = path.resolve(process.cwd(), 'src/app/student/od-requests/new/page.tsx');

  const applyOdExists = fs.existsSync(applyOdPath);
  const newOdExists = fs.existsSync(newOdPath);
  const newOdContent = newOdExists ? fs.readFileSync(newOdPath, 'utf8') : '';

  assert(
    applyOdExists,
    'A. Route Consolidation > Canonical route /student/apply-od exists and is present',
    `Expected ${applyOdPath} to exist`
  );

  assert(
    newOdContent.includes('router.replace') && (newOdContent.includes('/student/apply-od') || newOdContent.includes('ApplyOD')),
    'A. Route Consolidation > Duplicate route /student/od-requests/new is a thin compatibility forwarder to /student/apply-od',
    'Expected /student/od-requests/new to redirect or forward to /student/apply-od without maintaining a competing form'
  );

  // ==========================================
  // CATEGORY B: OD PAYLOAD COMPLIANCE
  // ==========================================
  const mockODFormInput: Partial<ODApplication> = {
    purpose: 'HACKATHON',
    eventName: 'Smart India Hackathon 2026',
    startDate: '2026-10-15',
    endDate: '2026-10-17',
    fromTime: '09:00 AM',
    toTime: '05:00 PM',
    venue: 'IIT Madras Research Park',
    registrationId: 'SIH-2026-9921',
    reason: 'Finalist presentation for SIET CSE automated invigilator project.',
    teamMembers: [
      { name: 'Meena C', regNo: '714023104088', role: 'LEAD', email: 'meena.23cse@siet.ac.in' },
      { name: 'Nattu K', regNo: '714022104002', role: 'MEMBER', email: 'nattu.22cse@siet.ac.in' },
    ],
    documentIds: ['doc-uuid-001', 'doc-uuid-002'],
  };

  const payload: CreateODPayload = mapODApplicationToApiPayload(mockODFormInput);

  assert(
    payload.purpose === 'HACKATHON' &&
    payload.event_name === 'Smart India Hackathon 2026' &&
    payload.venue === 'IIT Madras Research Park' &&
    payload.registration_id === 'SIH-2026-9921' &&
    payload.start_date === '2026-10-15' &&
    payload.end_date === '2026-10-17' &&
    payload.from_time === '09:00:00' &&
    payload.to_time === '17:00:00' &&
    payload.total_days === 3 &&
    Array.isArray(payload.team_members) &&
    payload.team_members.length === 2 &&
    Array.isArray(payload.document_ids) &&
    payload.document_ids.length === 2,
    'B. Payload Structure > OD creation payload emits strictly compliant snake_case fields matching API Contract v2.0',
    `Received: ${JSON.stringify(payload)}`
  );

  // ==========================================
  // CATEGORY C: TIME HANDLING (PRESETS & NORMALIZATION)
  // ==========================================
  const fullDayFrom = formatTimeToHHMMSS('09:00 AM');
  const fullDayTo = formatTimeToHHMMSS('05:00 PM');
  const forenoonFrom = formatTimeToHHMMSS('09:00 AM');
  const forenoonTo = formatTimeToHHMMSS('01:00 PM');
  const afternoonFrom = formatTimeToHHMMSS('01:00 PM');
  const afternoonTo = formatTimeToHHMMSS('05:00 PM');
  const customTimeFrom = formatTimeToHHMMSS('10:45 AM');
  const customTimeTo = formatTimeToHHMMSS('03:15 PM');

  assert(
    fullDayFrom === '09:00:00' && fullDayTo === '17:00:00' &&
    forenoonFrom === '09:00:00' && forenoonTo === '13:00:00' &&
    afternoonFrom === '13:00:00' && afternoonTo === '17:00:00' &&
    customTimeFrom === '10:45:00' && customTimeTo === '15:15:00',
    'C. Time Handling > Quick presets (Full Day, Forenoon, Afternoon) and Custom Period normalize to strict HH:MM:SS',
    `fullDay: ${fullDayFrom}-${fullDayTo}, forenoon: ${forenoonFrom}-${forenoonTo}, afternoon: ${afternoonFrom}-${afternoonTo}, custom: ${customTimeFrom}-${customTimeTo}`
  );

  // ==========================================
  // CATEGORY D: DATE HANDLING & TOTAL DAYS
  // ==========================================
  const singleDayDays = calculateTotalDays('2026-10-15', '2026-10-15');
  const singleDateOnly = calculateTotalDays('2026-10-15');
  const multiDayDays = calculateTotalDays('2026-10-15', '2026-10-17');
  const dateFormatted = formatDateToYYYYMMDD('2026-10-15T00:00:00.000Z');

  assert(
    singleDayDays === 1 && singleDateOnly === 1 && multiDayDays === 3 && dateFormatted === '2026-10-15',
    'D. Date Handling > Total days calculates accurately for single-day, same start/end, and multi-day date ranges in YYYY-MM-DD',
    `singleDay: ${singleDayDays}, singleDateOnly: ${singleDateOnly}, multiDay: ${multiDayDays}, formatted: ${dateFormatted}`
  );

  // ==========================================
  // CATEGORY E: TEAM MEMBERS
  // ==========================================
  const teamMemberOutput = payload.team_members || [];
  const lead = teamMemberOutput.find((m) => m.role === 'LEAD');
  const member = teamMemberOutput.find((m) => m.role === 'MEMBER');

  assert(
    lead !== undefined && lead.register_number === '714023104088' && lead.name === 'Meena C' &&
    member !== undefined && member.register_number === '714022104002' && member.name === 'Nattu K',
    'E. Team Members > Preserves register_number, name, and role for lead and group teammates without arbitrary IDs',
    `Received team members: ${JSON.stringify(teamMemberOutput)}`
  );

  // ==========================================
  // CATEGORY F: SUPPORTING DOCUMENTS
  // ==========================================
  assert(
    Array.isArray(payload.document_ids) &&
    payload.document_ids.every((id) => !id.includes('.pdf') && !id.includes('.png')),
    'F. Documents > Supporting documents represented as document_ids UUID array rather than filename strings in API payload',
    `document_ids: ${JSON.stringify(payload.document_ids)}`
  );

  // ==========================================
  // CATEGORY G: OD CONFLICTS (MOCK/OFFLINE CONTRACT)
  // ==========================================
  const conflictResponse = await odApi.getODConflicts('OD-2026-001');

  assert(
    conflictResponse &&
    typeof conflictResponse.data.has_conflict === 'boolean' &&
    Array.isArray(conflictResponse.data.conflicts),
    'G. Conflict Check > Conflict operation routes through odApi without live network calls and returns ODConflictResponse contract shape',
    `Received conflict response: ${JSON.stringify(conflictResponse)}`
  );

  // ==========================================
  // CATEGORY H: REVISION & RESUBMISSION LIFECYCLE
  // ==========================================
  const revisionOD = fixtureApiODs.find((o) => o.status === 'REVISION_REQUESTED') || {
    ...fixtureApiODs[0],
    id: 'OD-TEST-REV',
    status: 'REVISION_REQUESTED' as ApiODStatus,
    revision_notes: 'Please attach official college invitation slip',
  };

  const mappedRevOD = mapApiODToODApplication(revisionOD);
  assert(
    mappedRevOD.status === 'REVISION_REQUESTED' && mappedRevOD.revisionNotes !== undefined,
    'H. Revision Flow > OD UI correctly identifies REVISION_REQUESTED state and renders revision notes',
    `status: ${mappedRevOD.status}, notes: ${mappedRevOD.revisionNotes}`
  );

  // Resubmit through odApi
  const resubmitPayload: ResubmitODPayload = {
    event_name: 'Smart India Hackathon 2026 (Updated Invitation Attached)',
    revision_notes: 'Attached verified invitation letter as requested by HOD.',
  };
  const resubmitRes = await odApi.resubmitODRequest(revisionOD.id, resubmitPayload);

  assert(
    resubmitRes.data.status === 'PENDING',
    'H. Revision Flow > Resubmitting revised OD request transitions status from REVISION_REQUESTED to PENDING',
    `Updated status: ${resubmitRes.data.status}`
  );

  // ==========================================
  // CATEGORY I: HOD DECISION LIFECYCLE
  // ==========================================
  const approvedRes = await odApi.executeDecision('OD-2026-001', {
    decision: 'APPROVED',
    remarks: 'Clearance granted by HOD.',
  });

  const rejectedRes = await odApi.executeDecision('OD-2026-001', {
    decision: 'REJECTED',
    rejection_reason: 'Schedule overlaps with mid-term examinations.',
  });

  const revisionRes = await odApi.executeDecision('OD-2026-001', {
    decision: 'REVISION_REQUESTED',
    revision_notes: 'Please attach verified hall ticket.',
  });

  assert(
    approvedRes.data.status === 'APPROVED' &&
    rejectedRes.data.status === 'REJECTED' &&
    revisionRes.data.status === 'REVISION_REQUESTED' &&
    revisionRes.data.revisionNotes === 'Please attach verified hall ticket.',
    'I. HOD Decision Lifecycle > Transitions accurately across PENDING -> APPROVED, REJECTED, and REVISION_REQUESTED with notes',
    `Approved: ${approvedRes.data.status}, Rejected: ${rejectedRes.data.status}, Revision: ${revisionRes.data.status}`
  );

  // ==========================================
  // CATEGORY J: RFC 7807 ERROR PROPAGATION IN OD UI
  // ==========================================
  const validationError = new ApiError('VALIDATION_ERROR', 'Revision notes are required when requesting modifications', 422, {
    field: 'revision_notes',
    code: 'REVISION_NOTES_REQUIRED',
  });

  const parsed = parseApiError(validationError);
  const fieldMsg = getFieldError(parsed, 'revision_notes');

  assert(
    parsed.error.code === 'VALIDATION_ERROR' &&
    fieldMsg === 'Revision notes are required when requesting modifications',
    'J. Error Propagation > RFC 7807 validation errors unwrap field-level details accessible for OD form inputs via getFieldError',
    `fieldMsg: ${fieldMsg}`
  );

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n---------------------------------------------------------------');
  console.log(`TOTAL TESTS:  ${totalTests}`);
  console.log(`PASSED:       ${passedTests}`);
  console.log(`FAILED:       ${failedTests}`);
  console.log('---------------------------------------------------------------\n');

  if (failedTests > 0) {
    console.error(`FAILED: ${failedTests} test(s) failed in Phase 3 suite.`);
    process.exit(1);
  } else {
    console.log('ALL PHASE 3 EXISTING OD UI COMPATIBILITY CHECKS PASSED!\n');
    process.exit(0);
  }
}

runPhase3Tests().catch((err) => {
  console.error('Unhandled test suite failure:', err);
  process.exit(1);
});
