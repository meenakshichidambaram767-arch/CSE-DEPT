/**
 * Phase 2 Frontend State/Data-Layer Compatibility Test Suite
 * SIET CSE Department Platform - API Contract v2.0
 *
 * Verifies:
 * A. State Model Alignment (OD, Activity, Review status enums & types)
 * B. API State Action Routing (add, resubmit, decisions, progress, QR check-in)
 * C. Round-Trip Mapper Fidelity (UI Model -> API Payload -> Fixture -> UI Model)
 * D. RFC 7807 Error Propagation (code, message, status, field-level errors in state)
 * E. Standardized Pagination Preservation
 * F. Contract-Compatible Fixtures & Mutability Isolation
 * G. Non-Evaluative Review Engine Verification (Zero rubrics/grades/marks)
 */

import {
  ApiError,
  parseApiError,
  getFieldError,
} from '../src/lib/api/client';

import {
  odApi,
} from '../src/lib/api/odApi';

import {
  activitiesApi,
} from '../src/lib/api/activitiesApi';

import {
  reviewsApi,
} from '../src/lib/api/reviewsApi';

import {
  mapODApplicationToApiPayload,
  mapApiODToODApplication,
  mapApiActivityToActivity,
  mapApiReviewToReviewSession,
} from '../src/lib/api/mappers';

import {
  fixtureApiODs,
} from '../src/data/fixtures/odFixtures';

import {
  fixtureApiActivities,
} from '../src/data/fixtures/activitiesFixtures';

import {
  fixtureApiReviews,
} from '../src/data/fixtures/reviewsFixtures';

import {
  Activity,
  ODApplication,
  ReviewSession,
  WeeklyProgress,
} from '../src/types';

import {
  ApiODStatus,
  ApiActivityStatus,
  ApiReviewType,
} from '../src/types/contract';

// ==========================================
// TEST HARNESS
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

async function runTest(suite: string, name: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ [PASS] ${suite} > ${name}`);
  } catch (err: unknown) {
    failedTests++;
    const errMsg = err instanceof Error ? err.message : String(err);
    failures.push({ test: `${suite} > ${name}`, error: errMsg });
    console.error(`  ✗ [FAIL] ${suite} > ${name}: ${errMsg}`);
  }
}

async function runAllTests() {
  console.log('\n===============================================================');
  console.log('PHASE 2: FRONTEND STATE/DATA-LAYER COMPATIBILITY TEST SUITE');
  console.log('Authoritative Contract: SIET CSE Department Platform v2.0');
  console.log('===============================================================\n');

  // ==========================================
  // A. STATE MODEL TESTS
  // ==========================================

  await runTest('A. State Model', 'OD domain state adheres to contract status lifecycle', () => {
    const validODStatuses: ApiODStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'];
    const sampleODs: ODApplication[] = fixtureApiODs.map(mapApiODToODApplication);

    assert(sampleODs.length > 0, 'OD state items exist');
    for (const od of sampleODs) {
      assert(validODStatuses.includes(od.status as ApiODStatus), `OD status ${od.status} must be valid contract status`);
      assert(/^\d{4}-\d{2}-\d{2}$/.test(od.startDate || od.date || ''), 'OD startDate adheres to YYYY-MM-DD');
      assert(/^\d{2}:\d{2}:\d{2}$/.test(od.fromTime || ''), 'OD fromTime adheres to HH:MM:SS');
      assert(/^\d{2}:\d{2}:\d{2}$/.test(od.toTime || ''), 'OD toTime adheres to HH:MM:SS');
    }
  });

  await runTest('A. State Model', 'Activity domain state adheres to contract status lifecycle', () => {
    const validActivityStatuses: ApiActivityStatus[] = [
      'SUBMITTED',
      'ACTIVE',
      'REJECTED',
      'REVISION_REQUESTED',
      'COMPLETED',
    ];
    const sampleActs: Activity[] = fixtureApiActivities.map(mapApiActivityToActivity);

    assert(sampleActs.length > 0, 'Activity state items exist');
    for (const act of sampleActs) {
      assert(validActivityStatuses.includes(act.status as ApiActivityStatus), `Activity status ${act.status} must be valid`);
      assert(['PROJECT', 'HACKATHON', 'INTERNSHIP'].includes(act.type), `Activity type ${act.type} must be valid`);
      assert(Array.isArray(act.technologies), 'Technologies must be an array');
      assert(Array.isArray(act.teamMembers), 'teamMembers must be an array');
    }
  });

  await runTest('A. State Model', 'Review domain state adheres to contract review types', () => {
    const validReviewTypes: ApiReviewType[] = [
      'PROJECT_WEEKLY',
      'HACKATHON_POST',
      'INTERNSHIP_MID',
      'INTERNSHIP_FINAL',
    ];
    const sampleReviews: ReviewSession[] = fixtureApiReviews.map(mapApiReviewToReviewSession);

    assert(sampleReviews.length > 0, 'Review state items exist');
    for (const rev of sampleReviews) {
      assert(validReviewTypes.includes(rev.reviewType as ApiReviewType), `Review type ${rev.reviewType} must be valid`);
      assert(['SCHEDULED', 'COMPLETED', 'CANCELLED'].includes(rev.status), `Review status ${rev.status} must be valid`);
      assert(Array.isArray(rev.attendance), 'Review attendance must be an array');
    }
  });

  // ==========================================
  // B. API STATE ACTION TESTS
  // ==========================================

  await runTest('B. State Actions', 'addODApplication routes through odApi and yields contract-shaped OD', async () => {
    const rawUIData: Partial<ODApplication> = {
      purpose: 'HACKATHON',
      eventName: 'Tamil Nadu State Hackathon',
      reason: 'Prototype presentation',
      startDate: '2026-11-20',
      endDate: '2026-11-22',
      fromTime: '09:00 AM',
      toTime: '06:00 PM',
      totalDays: 3,
      venue: 'Anna University, Chennai',
      registrationId: 'TNSH-2026-104',
      teamMembers: [
        { name: 'Meena C', regNo: '714023104088', email: 'meena@siet.ac.in', role: 'Lead' },
      ],
    };

    const res = await odApi.createODRequest(rawUIData);
    assert(res.data !== undefined, 'Result data exists');
    assertEqual(res.data.status, 'PENDING', 'New OD status is PENDING');
    assertEqual(res.data.eventName, 'Tamil Nadu State Hackathon', 'Event name matches');
    assertEqual(res.data.fromTime, '09:00:00', 'fromTime normalized to HH:MM:SS');
    assertEqual(res.data.toTime, '18:00:00', 'toTime normalized to HH:MM:SS');
    assertEqual(res.data.totalDays, 3, 'Total days matches');
  });

  await runTest('B. State Actions', 'resubmitOD routes through odApi and resets status to PENDING', async () => {
    const res = await odApi.resubmitODRequest('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
      revision_notes: 'Updated selection letter attached with institutional seal.',
    });
    assertEqual(res.data.status, 'PENDING', 'Resubmitted OD status transitions to PENDING');
    assert(res.data.revisionNotes === undefined, 'Previous revision notes cleared on resubmission');
  });

  await runTest('B. State Actions', 'executeDecision for OD handles APPROVED, REJECTED, and REVISION_REQUESTED', async () => {
    const approveRes = await odApi.executeDecision('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
      decision: 'APPROVED',
      remarks: 'Endorsed for national final round.',
    });
    assertEqual(approveRes.data.status, 'APPROVED', 'Decision transitions to APPROVED');
    assertEqual(approveRes.data.remarks, 'Endorsed for national final round.', 'Remarks preserved');

    const rejectRes = await odApi.executeDecision('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
      decision: 'REJECTED',
      rejection_reason: 'Conflict with end-semester lab practicals.',
    });
    assertEqual(rejectRes.data.status, 'REJECTED', 'Decision transitions to REJECTED');
    assertEqual(rejectRes.data.rejectionReason, 'Conflict with end-semester lab practicals.', 'Rejection reason preserved');

    const revisionRes = await odApi.executeDecision('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
      decision: 'REVISION_REQUESTED',
      revision_notes: 'Provide parent consent letter.',
    });
    assertEqual(revisionRes.data.status, 'REVISION_REQUESTED', 'Decision transitions to REVISION_REQUESTED');
    assertEqual(revisionRes.data.revisionNotes, 'Provide parent consent letter.', 'Revision notes preserved');
  });

  await runTest('B. State Actions', 'addActivity routes through activitiesApi and yields SUBMITTED activity', async () => {
    const rawAct: Partial<Activity> = {
      type: 'PROJECT',
      title: 'Smart Waste Sorting Drone',
      description: 'Edge-AI quadcopter for recyclable waste identification.',
      technologies: ['C++', 'TensorRT', 'ROS2'],
      startDate: '2026-10-01',
      endDate: '2026-12-31',
      githubUrl: 'https://github.com/cse/drone-waste-sort',
      guideName: 'Dr. C. Chidambaram',
      teamMembers: [
        { name: 'Meena C', regNo: '714023104088', email: 'meena@siet.ac.in', role: 'Lead' },
      ],
    };

    const res = await activitiesApi.createActivity(rawAct);
    assert(res.data !== undefined, 'Activity result exists');
    assertEqual(res.data.status, 'SUBMITTED', 'New activity status is SUBMITTED');
    assertEqual(res.data.type, 'PROJECT', 'Activity type is PROJECT');
    assertEqual(res.data.title, 'Smart Waste Sorting Drone', 'Title matches');
  });

  await runTest('B. State Actions', 'submitWeeklyProgress routes through reviewsApi with 4 quadrants', async () => {
    const progressPayload: Partial<WeeklyProgress> = {
      completedThisWeek: 'Finished ROS2 sensor driver.',
      currentlyWorkingOn: 'Camera gimbal calibration.',
      nextWeekGoal: 'Autonomous flight test in drone cage.',
      blockers: 'Battery overheating during sustained hover.',
      githubUrl: 'https://github.com/cse/drone-waste-sort/commit/f4e21a',
    };

    const res = await reviewsApi.submitProgress('rev-sess-001', progressPayload);
    assert(res.data.success === true, 'Progress submission marked success');
    assert(typeof res.data.id === 'string', 'Progress ID returned');
  });

  await runTest('B. State Actions', 'checkInWithQR routes through reviewsApi and verifies check-in', async () => {
    const res = await reviewsApi.checkIn('rev-sess-002', 'HMAC_DYNAMIC_QR_TOKEN_002');
    assert(res.data.success === true, 'Check-in verified');
    assert(res.data.student_id === 'usr-student-001', 'Student ID verified');
  });

  // ==========================================
  // C. MAPPER ROUND-TRIP FIDELITY TESTS
  // ==========================================

  await runTest('C. Mapper Fidelity', 'OD Model round trip preserves all contract fields', () => {
    const originalUI: Partial<ODApplication> = {
      purpose: 'INTERNSHIP',
      eventName: 'Amazon SDE Winter Internship',
      reason: 'On-site technical bootcamp',
      startDate: '2026-12-01',
      endDate: '2026-12-05',
      fromTime: '08:30 AM',
      toTime: '05:30 PM',
      totalDays: 5,
      venue: 'Amazon Development Centre, Hyderabad',
      registrationId: 'AMZN-INT-991',
      teamMembers: [
        { name: 'Meena C', regNo: '714023104088', email: 'meena@siet.ac.in', role: 'Applicant' },
      ],
      documentIds: ['doc-amazon-offer-01'],
    };

    // Step 1: Map UI to API Payload
    const apiPayload = mapODApplicationToApiPayload(originalUI);
    assertEqual(apiPayload.from_time, '08:30:00', 'from_time converted to HH:MM:SS');
    assertEqual(apiPayload.to_time, '17:30:00', 'to_time converted to HH:MM:SS');
    assertEqual(apiPayload.team_members?.[0].register_number, '714023104088', 'team member register_number mapped');

    // Step 2: Simulate contract response
    const mockApiResponse = {
      ...fixtureApiODs[0],
      id: 'od-amazon-001',
      event_name: apiPayload.event_name,
      purpose: apiPayload.purpose,
      start_date: apiPayload.start_date,
      end_date: apiPayload.end_date,
      from_time: apiPayload.from_time,
      to_time: apiPayload.to_time,
      total_days: apiPayload.total_days,
      venue: apiPayload.venue,
      registration_id: apiPayload.registration_id,
      team_members: apiPayload.team_members,
      document_ids: apiPayload.document_ids,
      status: 'PENDING' as const,
    };

    // Step 3: Map API Response back to UI Model
    const roundTripUI = mapApiODToODApplication(mockApiResponse);
    assertEqual(roundTripUI.eventName, originalUI.eventName, 'Event name preserved');
    assertEqual(roundTripUI.purpose, originalUI.purpose, 'Purpose preserved');
    assertEqual(roundTripUI.totalDays, originalUI.totalDays, 'Total days preserved');
    assertEqual(roundTripUI.venue, originalUI.venue, 'Venue preserved');
    assertEqual(roundTripUI.teamMembers?.[0]?.regNo, '714023104088', 'Team member regNo preserved');
    assertEqual(roundTripUI.documentIds?.[0], 'doc-amazon-offer-01', 'Document ID preserved');
  });

  // ==========================================
  // D. RFC 7807 ERROR PROPAGATION TESTS
  // ==========================================

  await runTest('D. Error Propagation', 'ApiError preserves code, message, status, and field in state layer', () => {
    let capturedError: ApiError | null = null;

    try {
      throw new ApiError('REVISION_NOTES_REQUIRED', 'Revision directive is mandatory when requesting revision.', 422, {
        field: 'revision_notes',
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        capturedError = err;
      }
    }

    assert(capturedError !== null, 'Captured ApiError');
    assertEqual(capturedError!.code, 'REVISION_NOTES_REQUIRED', 'Error code preserved');
    assertEqual(capturedError!.status, 422, 'HTTP status preserved');
    assertEqual(capturedError!.message, 'Revision directive is mandatory when requesting revision.', 'Message preserved');
    assertEqual(capturedError!.field, 'revision_notes', 'Target field preserved');
    assertEqual(capturedError!.isValidationError, true, 'Flagged as validation error');
    assertEqual(getFieldError(capturedError, 'revision_notes'), 'Revision directive is mandatory when requesting revision.', 'getFieldError retrieves field message');
  });

  await runTest('D. Error Propagation', 'parseApiError unwraps structured RFC 7807 contract payload', () => {
    const rawRfcPayload = {
      error: {
        code: 'OD_TIMETABLE_CONFLICT',
        message: 'Student already has an approved OD on this date.',
        details: {
          field: 'start_date',
          conflicting_od_id: 'OD-2026-001',
          conflicting_event: 'Smart India Hackathon',
        },
      },
    };

    const parsed = parseApiError(rawRfcPayload);
    assertEqual(parsed.error.code, 'OD_TIMETABLE_CONFLICT', 'Code matches');
    assertEqual(parsed.error.message, 'Student already has an approved OD on this date.', 'Message matches');
    assertEqual(parsed.error.details?.field, 'start_date', 'Details field matches');
  });

  // ==========================================
  // E. PAGINATION TESTS
  // ==========================================

  await runTest('E. Pagination', 'Standardized PaginatedResponse survives state layer across list APIs', async () => {
    const odList = await odApi.getODRequests({ page: 1, page_size: 10 });
    assert(Array.isArray(odList.data), 'OD list data is array');
    assert(odList.meta !== undefined, 'Pagination meta exists');
    assertEqual(odList.meta.page, 1, 'Page matches');
    assertEqual(odList.meta.page_size, 10, 'Page size matches');
    assert(odList.meta.total >= odList.data.length, 'Total matches or exceeds page count');

    const actList = await activitiesApi.getActivities({ page: 1, page_size: 20 });
    assert(Array.isArray(actList.data), 'Activities list data is array');
    assertEqual(actList.meta.page, 1, 'Page matches');

    const revList = await reviewsApi.getSessions({ page: 1, page_size: 20 });
    assert(Array.isArray(revList.data), 'Reviews list data is array');
    assertEqual(revList.meta.page, 1, 'Page matches');
  });

  // ==========================================
  // F. FIXTURE COMPATIBILITY TESTS
  // ==========================================

  await runTest('F. Fixtures', 'Fixture data mutations are non-destructive and isolated', () => {
    const initialODCount = fixtureApiODs.length;
    const clonedODs = [...fixtureApiODs];
    clonedODs.push({
      ...fixtureApiODs[0],
      id: 'local-test-od-mut',
      code: 'OD-TEST-MUT',
    });

    assert(fixtureApiODs.length === initialODCount, 'Raw fixture array remains untouched');
    assertEqual(clonedODs.length, initialODCount + 1, 'Cloned array expanded');
  });

  // ==========================================
  // G. NON-EVALUATIVE REVIEW VERIFICATION
  // ==========================================

  await runTest('G. Non-Evaluative Reviews', 'Strictly zero rubrics, marks, scores, or grades in review state', () => {
    const forbiddenKeys = [
      'marks',
      'score',
      'rating',
      'rubric',
      'technicalKnowledge',
      'technicalScore',
      'implementationScore',
      'grade',
      'ranking',
      'performanceLabel',
      'passFail',
    ];

    const reviews: ReviewSession[] = fixtureApiReviews.map(mapApiReviewToReviewSession);

    for (const rev of reviews) {
      const rawSession = (rev as unknown) as Record<string, unknown>;
      for (const key of forbiddenKeys) {
        assert(
          rawSession[key] === undefined,
          `ReviewSession must NOT contain evaluative field "${key}"`
        );
      }

      if (rev.progress) {
        const rawProg = (rev.progress as unknown) as Record<string, unknown>;
        for (const key of forbiddenKeys) {
          assert(
            rawProg[key] === undefined,
            `WeeklyProgress must NOT contain evaluative field "${key}"`
          );
        }

        // Verify required 4 non-evaluative quadrants
        assert(typeof rev.progress.completedThisWeek === 'string', 'completedThisWeek exists');
        assert(typeof rev.progress.currentlyWorkingOn === 'string', 'currentlyWorkingOn exists');
        assert(typeof rev.progress.nextWeekGoal === 'string', 'nextWeekGoal exists');
        assert(typeof rev.progress.blockers === 'string', 'blockers exists');
      }
    }
  });

  // ==========================================
  // SUMMARY
  // ==========================================

  console.log('\n---------------------------------------------------------------');
  console.log(`TOTAL TESTS:  ${totalTests}`);
  console.log(`PASSED:       ${passedTests}`);
  console.log(`FAILED:       ${failedTests}`);
  console.log('---------------------------------------------------------------\n');

  if (failures.length > 0) {
    console.error('FAILURES:');
    for (const f of failures) {
      console.error(`- ${f.test}: ${f.error}`);
    }
    process.exit(1);
  } else {
    console.log('ALL PHASE 2 FRONTEND STATE-LAYER COMPATIBILITY CHECKS PASSED!\n');
  }
}

runAllTests().catch((e) => {
  console.error('Test execution failed:', e);
  process.exit(1);
});
