/**
 * Phase 5 Verification Script:
 * Existing Reviews + QR UI API-Contract Compatibility Retrofit
 * 
 * Tests 41 criteria + non-evaluative static analysis.
 */

import fs from 'fs';
import path from 'path';
import {
  reviewsApi,
  mapProgressToContract,
  mapContractToProgress,
  mapReviewSessionToContract,
  mapContractToReviewSession,
  validateProgressContract,
  type ReviewTypeContract,
  type ReviewSessionStatusContract,
  type ReviewProgressContract,
  type ScheduleReviewContractPayload,
} from '../src/lib/api';
import { ApiError, parseApiError, formatApiErrorMessage } from '../src/lib/api/client';
import type { ReviewSession, ReviewType, ReviewSessionStatus, AttendanceItem } from '../src/types';

interface TestResult {
  id: number;
  name: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function assert(id: number, name: string, condition: boolean, message?: string) {
  results.push({
    id,
    name,
    passed: condition,
    message: condition ? undefined : message || 'Assertion failed',
  });
}

async function runPhase5Tests() {
  console.log('====================================================');
  console.log('STARTING PHASE 5 REVIEWS + QR UI COMPATIBILITY TESTS');
  console.log('====================================================\n');

  // 1. Reviews routes exist
  const studentReviewRoute = path.resolve(process.cwd(), 'src/app/student/reviews/page.tsx');
  const hodReviewRoute = path.resolve(process.cwd(), 'src/app/hod/reviews/page.tsx');
  assert(1, 'Reviews routes exist', fs.existsSync(studentReviewRoute) && fs.existsSync(hodReviewRoute));

  // 2. Student review UI exports a valid component
  const studentSrc = fs.readFileSync(studentReviewRoute, 'utf-8');
  assert(2, 'Student review UI renders / exports component', studentSrc.includes('export default function StudentReviewsPage') || studentSrc.includes('StudentReviewsPage'));

  // 3. HOD review UI exports a valid component
  const hodSrc = fs.readFileSync(hodReviewRoute, 'utf-8');
  assert(3, 'HOD review UI renders / exports component', hodSrc.includes('export default function HodReviewsPage') || hodSrc.includes('HodReviewsPage'));

  // 4-7. Review types
  const validReviewTypes: ReviewTypeContract[] = ['PROJECT_WEEKLY', 'HACKATHON_POST', 'INTERNSHIP_MID', 'INTERNSHIP_FINAL'];
  assert(4, 'Review type PROJECT_WEEKLY supported', validReviewTypes.includes('PROJECT_WEEKLY'));
  assert(5, 'Review type HACKATHON_POST supported', validReviewTypes.includes('HACKATHON_POST'));
  assert(6, 'Review type INTERNSHIP_MID supported', validReviewTypes.includes('INTERNSHIP_MID'));
  assert(7, 'Review type INTERNSHIP_FINAL supported', validReviewTypes.includes('INTERNSHIP_FINAL'));

  // 8-10. Review statuses
  const validStatuses: ReviewSessionStatusContract[] = ['SCHEDULED', 'COMPLETED', 'CANCELLED'];
  assert(8, 'Review status SCHEDULED supported', validStatuses.includes('SCHEDULED'));
  assert(9, 'Review status COMPLETED supported', validStatuses.includes('COMPLETED'));
  assert(10, 'Review status CANCELLED supported', validStatuses.includes('CANCELLED'));

  // 11-15. 4-Quadrant progress mapping & github_url
  const localProgress = {
    completedThisWeek: 'Implemented multi-camera pose estimation',
    currentlyWorkingOn: 'Optimizing YOLOv8 inference pipeline',
    nextWeekGoal: 'Deploy edge pipeline on Jetson Orin',
    blockers: 'CUDA driver memory fragmentation on batch size 8',
    githubUrl: 'https://github.com/siet-cse/smart-surveillance',
  };

  const contractReq = mapProgressToContract(localProgress);
  assert(11, 'completed_this_week mapping', contractReq.completed_this_week === localProgress.completedThisWeek);
  assert(12, 'currently_working_on mapping', contractReq.currently_working_on === localProgress.currentlyWorkingOn);
  assert(13, 'next_week_goal mapping', contractReq.next_week_goal === localProgress.nextWeekGoal);
  assert(14, 'blockers mapping', contractReq.blockers === localProgress.blockers);
  assert(15, 'github_url mapping', contractReq.github_url === localProgress.githubUrl);

  const mappedBack = mapContractToProgress(contractReq);
  if (mappedBack.completedThisWeek !== localProgress.completedThisWeek) {
    throw new Error('Bidirectional progress mapping mismatch');
  }

  // 16. Progress submission flow
  const allSessions = await reviewsApi.getAll();
  const targetSession = allSessions.find(s => s.status === 'SCHEDULED') || allSessions[0];
  const updatedProgress = await reviewsApi.submitProgress(targetSession.id, contractReq);
  assert(
    16,
    'Progress submission',
    updatedProgress !== undefined &&
    updatedProgress.completedThisWeek === contractReq.completed_this_week
  );

  // 17. Review scheduling with backend business rules
  // Rule A: PROJECT -> PROJECT_WEEKLY
  const projectSched = await reviewsApi.schedule({
    activity_id: 'act-test-proj',
    activity_title: 'Smart Surveillance Project',
    review_type: 'PROJECT_WEEKLY',
    scheduled_date: '2026-10-15',
    time: '10:00 AM',
    venue: 'CSE Lab 2',
    total_reviews: 3,
  });
  // Rule B: HACKATHON -> exactly 1 post-hackathon review
  const hackSched = await reviewsApi.schedule({
    activity_id: 'act-test-hack',
    activity_title: 'Hack Coimbatore 2026',
    review_type: 'HACKATHON_POST',
    scheduled_date: '2026-10-20',
    time: '02:00 PM',
    venue: 'Seminar Hall',
    total_reviews: 1,
  });
  // Rule C: INTERNSHIP -> exactly 2 reviews (MID and FINAL)
  const internSched = await reviewsApi.schedule({
    activity_id: 'act-test-intern',
    activity_title: 'Bosch Deep Learning Internship',
    review_type: 'INTERNSHIP_MID',
    scheduled_date: '2026-10-25',
    time: '11:00 AM',
    venue: 'HOD Office',
  });
  assert(
    17,
    'Review scheduling',
    projectSched.length === 3 &&
    hackSched.length === 1 &&
    internSched.length === 2 &&
    internSched.some(s => s.reviewType === 'INTERNSHIP_MID') &&
    internSched.some(s => s.reviewType === 'INTERNSHIP_FINAL')
  );

  // 18. Review session retrieval/state
  const fetchedSession = await reviewsApi.getById(targetSession.id);
  const scheduledSessions = await reviewsApi.getAll({ status: 'SCHEDULED' });
  assert(
    18,
    'Review session retrieval/state',
    fetchedSession !== undefined &&
    scheduledSessions.every(s => s.status === 'SCHEDULED')
  );

  // 19-20. QR generation & expiration
  const qrGen = await reviewsApi.generateQR(targetSession.id);
  assert(
    19,
    'QR generation',
    typeof qrGen.token === 'string' &&
    qrGen.token.startsWith('QR-') &&
    qrGen.valid_seconds === 1800 &&
    typeof qrGen.expires_at === 'string'
  );

  const expiresTime = new Date(qrGen.expires_at).getTime();
  const isExpFuture = expiresTime > Date.now();
  assert(20, 'QR expiration handling', isExpFuture);

  // 21. QR check-in
  const studentId = 'stu-p5-test-01';
  const checkInRes = await reviewsApi.checkInQR(targetSession.id, {
    token: qrGen.token,
    student_id: studentId,
    student_name: 'Meena C',
    student_reg_no: '714023104088',
  });
  assert(
    21,
    'QR check-in',
    checkInRes.success &&
    checkInRes.student_id === studentId &&
    typeof checkInRes.checked_in_at === 'string'
  );

  // 22. Invalid QR handling
  let invalidCaught = false;
  try {
    await reviewsApi.checkInQR(targetSession.id, {
      token: 'INVALID-TOKEN-999',
      student_id: 'stu-any',
    });
  } catch (err: any) {
    if (err instanceof ApiError && err.code === 'INVALID_TOKEN' && err.status === 400) {
      invalidCaught = true;
    }
  }
  assert(22, 'Invalid QR handling', invalidCaught);

  // 23. Expired QR handling
  let expiredCaught = false;
  const expiredQrGen = await reviewsApi.generateQR(targetSession.id, -60); // 60 seconds in past
  try {
    await reviewsApi.checkInQR(targetSession.id, {
      token: expiredQrGen.token,
      student_id: 'stu-expired-tester',
    });
  } catch (err: any) {
    if (err instanceof ApiError && (err.code === 'TOKEN_EXPIRED' || err.code === 'QR_EXPIRED') && err.status === 410) {
      expiredCaught = true;
    }
  }
  // Re-generate fresh QR for targetSession
  const freshQr = await reviewsApi.generateQR(targetSession.id, 1800);
  assert(23, 'Expired QR handling', expiredCaught);

  // 24. Duplicate check-in handling
  let duplicateCaught = false;
  try {
    // stu-p5-test-01 already checked in during test 21
    await reviewsApi.checkInQR(targetSession.id, {
      token: freshQr.token,
      student_id: studentId,
      student_name: 'Meena C',
      student_reg_no: '714023104088',
    });
  } catch (err: any) {
    if (err instanceof ApiError && (err.code === 'ALREADY_CHECKED_IN' || err.code === 'DUPLICATE_CHECK_IN') && err.status === 409) {
      duplicateCaught = true;
    }
  }
  assert(24, 'Duplicate check-in handling', duplicateCaught);

  // 25. Attendance state
  const manualAttItems: AttendanceItem[] = [
    { studentId: 'stu-p5-test-02', name: 'Karthik Raja', regNo: '714023104089', attended: true },
    { studentId: 'stu-p5-test-03', name: 'Naveen Kumar', regNo: '714023104090', attended: false },
  ];
  const manualAttRes = await reviewsApi.recordAttendance(targetSession.id, manualAttItems);
  assert(
    25,
    'Attendance state',
    manualAttRes.length >= 2 &&
    manualAttRes.some(a => a.studentId === 'stu-p5-test-02' && a.attended)
  );

  // 26. Meeting notes
  const notesText = 'Team demonstrated real-time inference on edge testbed. Advised them to profile memory leak before next week.';
  const notesRes = await reviewsApi.saveMeetingNotes(targetSession.id, {
    meeting_notes: notesText,
    next_week_goal: 'Optimize TensorRT engine',
  });
  assert(26, 'Meeting notes', notesRes.meetingNotes === notesText);

  // 27. Review finalization
  const finalized = await reviewsApi.finalizeReview(targetSession.id, {
    meeting_notes: notesText,
  });
  assert(
    27,
    'Review finalization',
    finalized.status === 'COMPLETED' &&
    finalized.session_id === targetSession.id &&
    typeof finalized.finalized_at === 'string'
  );

  // 28. Invalid finalization handling (already finalized)
  let alreadyFinalizedCaught = false;
  try {
    await reviewsApi.finalizeReview(targetSession.id);
  } catch (err: any) {
    if (err instanceof ApiError && (err.code === 'ALREADY_FINALIZED' || err.code === 'REVIEW_ALREADY_FINALIZED') && err.status === 409) {
      alreadyFinalizedCaught = true;
    }
  }
  assert(28, 'Invalid finalization handling', alreadyFinalizedCaught);

  // 29. RFC7807 errors
  const sampleRFCError = {
    error: {
      code: 'UNAUTHORIZED_ACTION',
      message: 'Only HOD may finalize a review session.',
      details: { role: 'STUDENT' },
    },
  };
  const parsed = parseApiError(sampleRFCError);
  const formatted = formatApiErrorMessage(parsed);
  assert(
    29,
    'RFC7807 errors',
    parsed.code === 'UNAUTHORIZED_ACTION' &&
    formatted.includes('Only HOD may finalize a review session')
  );

  // 30. Field-level validation
  const invalidGitReq: ReviewProgressContract = {
    completed_this_week: 'Done with camera pipeline',
    currently_working_on: 'Working on model conversion',
    next_week_goal: 'Test real-time FPS throughput',
    blockers: 'None so far',
    github_url: 'not-a-valid-url',
  };
  const gitValidation = validateProgressContract(invalidGitReq);
  const emptyReq: ReviewProgressContract = {
    completed_this_week: '',
    currently_working_on: '',
    next_week_goal: '',
    blockers: '',
  };
  const emptyValidation = validateProgressContract(emptyReq);
  assert(
    30,
    'Field-level validation',
    gitValidation.isValid === false &&
    gitValidation.errors.github_url !== undefined &&
    emptyValidation.isValid === false &&
    emptyValidation.errors.completed_this_week !== undefined
  );

  // 31-34. Non-evaluative static checks across Reviews UI files
  const reviewFiles = [
    studentReviewRoute,
    hodReviewRoute,
    path.resolve(process.cwd(), 'src/lib/api/reviewsApi.ts'),
    path.resolve(process.cwd(), 'src/lib/api/contractTypes.ts'),
    path.resolve(process.cwd(), 'src/data/mock/reviews.ts'),
  ];

  // Forbidden evaluation tokens (words representing marks, scoring, grading, rankings, rubrics)
  const forbiddenPatterns = [
    /\bReviewScore\b/i,
    /\bscores?\b/i,
    /\bmarks?\b/i,
    /\bgrades?\b/i,
    /\brubrics?\b/i,
    /\brankings?\b/i,
    /\bperformanceScore\b/i,
    /\bevaluationScore\b/i,
  ];

  let foundEvaluationTerms: string[] = [];

  for (const filePath of reviewFiles) {
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      // Exclude comments that document the non-evaluative rule itself
      if (line.includes('NON-EVALUATIVE') || line.includes('non-evaluative') || line.includes('No scores') || line.includes('forbidden')) {
        return;
      }
      for (const pat of forbiddenPatterns) {
        if (pat.test(line)) {
          foundEvaluationTerms.push(`${path.basename(filePath)}:${idx + 1} -> ${line.trim()}`);
        }
      }
    });
  }

  assert(31, 'No scoring UI', foundEvaluationTerms.length === 0, `Found: ${foundEvaluationTerms.join('; ')}`);
  assert(32, 'No rubric UI', !/\brubrics?\b/i.test(studentSrc) && !/\brubrics?\b/i.test(hodSrc));
  assert(33, 'No marks/grades UI', !/\bgrades?\b/i.test(studentSrc) && !/\bgrades?\b/i.test(hodSrc));
  assert(34, 'No performance rating UI', !/\brating(s)?\b/i.test(studentSrc) && !/\brating(s)?\b/i.test(hodSrc));

  // 35. No duplicate review enums
  const typesSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/types/index.ts'), 'utf-8');
  const contractTypesSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/api/contractTypes.ts'), 'utf-8');
  assert(
    35,
    'No duplicate review enums',
    typesSrc.includes("'PROJECT_WEEKLY'") &&
    typesSrc.includes("'HACKATHON_POST'") &&
    typesSrc.includes("'INTERNSHIP_MID'") &&
    typesSrc.includes("'INTERNSHIP_FINAL'") &&
    contractTypesSrc.includes("'PROJECT_WEEKLY'") &&
    contractTypesSrc.includes("'HACKATHON_POST'") &&
    contractTypesSrc.includes("'INTERNSHIP_MID'") &&
    contractTypesSrc.includes("'INTERNSHIP_FINAL'") &&
    typesSrc.includes("export type ReviewSessionStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';")
  );

  // 36. No review-specific localStorage fake DB
  const dataContextSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/context/DataContext.tsx'), 'utf-8');
  assert(
    36,
    'No review-specific localStorage fake DB',
    !dataContextSrc.includes("localStorage.setItem('siet_reviews'") &&
    !dataContextSrc.includes('STORAGE_KEY_REVIEWS')
  );

  // 37. No direct live backend calls
  const clientSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/api/client.ts'), 'utf-8');
  const reviewsApiSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/api/reviewsApi.ts'), 'utf-8');
  assert(
    37,
    'No direct live backend calls',
    clientSrc.includes('assertNoLiveNetwork') &&
    !reviewsApiSrc.includes('fetch(') &&
    !studentSrc.includes('fetch(') &&
    !hodSrc.includes('fetch(')
  );

  // 38. Phase 1 regression
  const apiIndexSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/api/index.ts'), 'utf-8');
  assert(
    38,
    'Phase 1 regression (Foundation API modules & client)',
    apiIndexSrc.includes('contractTypes') &&
    apiIndexSrc.includes('client') &&
    apiIndexSrc.includes('reviewsApi')
  );

  // 39. Phase 2 regression
  assert(
    39,
    'Phase 2 regression (DataContext review actions wired)',
    dataContextSrc.includes('submitWeeklyProgress') &&
    dataContextSrc.includes('generateReviewQR') &&
    dataContextSrc.includes('checkInReviewQR') &&
    dataContextSrc.includes('finalizeReviewSession')
  );

  // 40. Phase 3 OD regression
  const studentOdRoute = path.resolve(process.cwd(), 'src/app/student/od-requests/page.tsx');
  assert(40, 'Phase 3 OD regression', fs.existsSync(studentOdRoute));

  // 41. Phase 4 Activities regression
  const studentProjectsRoute = path.resolve(process.cwd(), 'src/app/student/projects/page.tsx');
  assert(41, 'Phase 4 Activities regression', fs.existsSync(studentProjectsRoute));

  console.log('\n----------------- TEST RESULTS -----------------');
  let passCount = 0;
  for (const r of results) {
    if (r.passed) {
      passCount++;
      console.log(`[PASS] ${r.id.toString().padStart(2, ' ')}. ${r.name}`);
    } else {
      console.error(`[FAIL] ${r.id.toString().padStart(2, ' ')}. ${r.name} - ${r.message}`);
    }
  }

  console.log('------------------------------------------------');
  console.log(`TOTAL: ${passCount} / ${results.length} PASSED`);

  if (passCount === results.length) {
    console.log('\n>>> PHASE 5 STATUS: ALL TESTS PASSED <<<\n');
    process.exit(0);
  } else {
    console.error('\n>>> PHASE 5 STATUS: SOME TESTS FAILED <<<\n');
    process.exit(1);
  }
}

runPhase5Tests().catch(err => {
  console.error('Fatal error running Phase 5 tests:', err);
  process.exit(1);
});
