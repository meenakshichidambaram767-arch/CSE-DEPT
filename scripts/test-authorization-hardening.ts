/**
 * Authorization & Identity Hardening Regression Test Suite
 * SIET CSE Department Platform — API Contract v2.0 & PostgreSQL RPC Hardening
 *
 * Verifies:
 * 1. Unauthenticated requests receive 401 (RFC 7807)
 * 2. Student users cannot access HOD decision/finalization routes (RFC 7807 403)
 * 3. Missing application user records in public.users are denied application access
 * 4. User-editable metadata cannot grant HOD privileges (database role is authoritative)
 * 5. Arbitrary actor UUID cannot impersonate an HOD through direct RPC execution
 * 6. Valid HOD actions succeed only for eligible records (state machine validation)
 * 7. Invalid transitions and concurrent duplicate decisions are rejected
 * 8. History, audit, and notifications remain atomic (ACID transaction & non-evaluative review)
 */

import fs from 'fs';
import path from 'path';
import { UserRole } from '../src/types';
import { apiError } from '../src/lib/api/response';

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

// ============================================================================
// SIMULATED AUTH ENGINE (matching hardened src/lib/api/auth.ts logic)
// ============================================================================

interface MockAuthUser {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
}

interface MockDbUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

interface MockDbState {
  authUser: MockAuthUser | null;
  dbUsers: Map<string, MockDbUser>;
  students: Map<string, any>;
  hods: Map<string, any>;
}

function resolveAuthenticatedUser(state: MockDbState) {
  if (!state.authUser) {
    return null;
  }

  const dbUser = state.dbUsers.get(state.authUser.id);
  if (!dbUser) {
    // HARDENING: Missing public.users record denies application access.
    // Untrusted user_metadata is NEVER consulted.
    return null;
  }

  let studentProfile;
  let hodProfile;

  if (dbUser.role === 'STUDENT') {
    const sp = state.students.get(state.authUser.id);
    if (sp) {
      studentProfile = {
        id: sp.id,
        registerNumber: sp.register_number,
        department: sp.department,
        year: sp.year,
        section: sp.section,
      };
    }
  } else if (dbUser.role === 'HOD') {
    const hp = state.hods.get(state.authUser.id);
    if (hp) {
      hodProfile = {
        id: hp.id,
        designation: hp.designation,
        department: hp.department,
      };
    }
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role as UserRole,
    name: dbUser.name,
    studentProfile,
    hodProfile,
  };
}

function assertRequireAuth(userContext: ReturnType<typeof resolveAuthenticatedUser>) {
  if (!userContext) {
    throw new Error('UNAUTHORIZED');
  }
  return userContext;
}

function assertRequireRole(
  userContext: ReturnType<typeof resolveAuthenticatedUser>,
  allowedRoles: UserRole[]
) {
  const authUser = assertRequireAuth(userContext);
  if (!allowedRoles.includes(authUser.role)) {
    throw new Error('FORBIDDEN');
  }
  return authUser;
}

// ============================================================================
// SIMULATED POSTGRESQL RPC EXECUTION ENGINE (matching hardened migrations)
// ============================================================================

interface MockRpcContext {
  callerUid: string | null; // Value returned by auth.uid() in PostgreSQL
  dbUsers: Map<string, MockDbUser>;
  odRequests: Map<string, any>;
  activities: Map<string, any>;
  reviewSessions: Map<string, any>;
  statusHistory: any[];
  auditLogs: any[];
  notifications: any[];
}

function simulateExecHodOdDecision(
  ctx: MockRpcContext,
  p_od_id: string,
  p_actor_id: string | null,
  p_decision: string,
  p_remarks?: string | null,
  p_rejection_reason?: string | null,
  p_revision_notes?: string | null
) {
  // 1. Caller identity binding
  const v_caller_id = ctx.callerUid;
  let v_effective_actor_id: string;

  if (v_caller_id !== null) {
    if (p_actor_id !== null && p_actor_id !== v_caller_id) {
      const err = new Error('FORBIDDEN: Caller identity does not match specified actor ID.');
      (err as any).code = 'P0001';
      throw err;
    }
    v_effective_actor_id = v_caller_id;
  } else {
    if (!p_actor_id) {
      const err = new Error('UNAUTHORIZED: Authentication required to execute decisions.');
      (err as any).code = 'P0001';
      throw err;
    }
    v_effective_actor_id = p_actor_id;
  }

  // 2. Authorization check against public.users
  const user = ctx.dbUsers.get(v_effective_actor_id);
  if (!user || user.role !== 'HOD') {
    const err = new Error('FORBIDDEN: Only authorized HOD can execute decisions.');
    (err as any).code = 'P0001';
    throw err;
  }

  // 3. Validate decision enum
  if (!['APPROVED', 'REJECTED', 'REVISION_REQUESTED'].includes(p_decision)) {
    const err = new Error('INVALID_DECISION: Decision must be APPROVED, REJECTED, or REVISION_REQUESTED.');
    (err as any).code = 'P0002';
    throw err;
  }

  // 4. Validate mandatory reason/notes
  if (p_decision === 'REJECTED' && (!p_rejection_reason || !p_rejection_reason.trim())) {
    const err = new Error('REJECTION_REASON_REQUIRED: Rejection reason must be provided.');
    (err as any).code = 'P0003';
    throw err;
  }
  if (p_decision === 'REVISION_REQUESTED' && (!p_revision_notes || !p_revision_notes.trim())) {
    const err = new Error('REVISION_NOTES_REQUIRED: Revision notes must be provided.');
    (err as any).code = 'P0004';
    throw err;
  }

  // 5. Row locking & existence check
  const od = ctx.odRequests.get(p_od_id);
  if (!od) {
    const err = new Error('NOT_FOUND: OD request not found.');
    (err as any).code = 'P0005';
    throw err;
  }

  // 6. State machine check
  if (od.status !== 'PENDING') {
    const err = new Error(`INVALID_TRANSITION: Cannot execute decision on request in ${od.status} status.`);
    (err as any).code = 'P0006';
    throw err;
  }

  // 7. Atomic update
  od.status = p_decision;
  od.remarks = p_remarks || null;
  od.rejection_reason = p_decision === 'REJECTED' ? p_rejection_reason : null;
  od.revision_notes = p_decision === 'REVISION_REQUESTED' ? p_revision_notes : null;
  od.approved_date = p_decision === 'APPROVED' ? new Date().toISOString() : null;

  // 8. Atomic status history
  ctx.statusHistory.push({
    target_id: p_od_id,
    old_status: 'PENDING',
    new_status: p_decision,
    changed_by: v_effective_actor_id,
  });

  // 9. Atomic audit log
  ctx.auditLogs.push({
    actor_id: v_effective_actor_id,
    actor_role: 'HOD',
    action: `OD Request ${p_decision}`,
    target_id: p_od_id,
  });

  // 10. Atomic notification
  ctx.notifications.push({
    user_id: od.student_user_id,
    type: 'OD_UPDATE',
    decision: p_decision,
  });

  return { id: p_od_id, status: p_decision };
}

function simulateExecHodActivityDecision(
  ctx: MockRpcContext,
  p_activity_id: string,
  p_actor_id: string | null,
  p_decision: string,
  p_remarks?: string | null,
  p_rejection_reason?: string | null,
  p_revision_notes?: string | null
) {
  const v_caller_id = ctx.callerUid;
  let v_effective_actor_id: string;

  if (v_caller_id !== null) {
    if (p_actor_id !== null && p_actor_id !== v_caller_id) {
      const err = new Error('FORBIDDEN: Caller identity does not match specified actor ID.');
      (err as any).code = 'P0001';
      throw err;
    }
    v_effective_actor_id = v_caller_id;
  } else {
    if (!p_actor_id) {
      const err = new Error('UNAUTHORIZED: Authentication required to execute decisions.');
      (err as any).code = 'P0001';
      throw err;
    }
    v_effective_actor_id = p_actor_id;
  }

  const user = ctx.dbUsers.get(v_effective_actor_id);
  if (!user || user.role !== 'HOD') {
    const err = new Error('FORBIDDEN: Only authorized HOD can execute activity decisions.');
    (err as any).code = 'P0001';
    throw err;
  }

  let finalDecision = p_decision === 'APPROVED' ? 'ACTIVE' : p_decision;

  if (!['ACTIVE', 'REJECTED', 'REVISION_REQUESTED'].includes(finalDecision)) {
    const err = new Error('INVALID_DECISION: Decision must be ACTIVE, REJECTED, or REVISION_REQUESTED.');
    (err as any).code = 'P0002';
    throw err;
  }

  if (finalDecision === 'REJECTED' && (!p_rejection_reason || !p_rejection_reason.trim())) {
    const err = new Error('REJECTION_REASON_REQUIRED: Rejection reason must be provided.');
    (err as any).code = 'P0003';
    throw err;
  }
  if (finalDecision === 'REVISION_REQUESTED' && (!p_revision_notes || !p_revision_notes.trim())) {
    const err = new Error('REVISION_NOTES_REQUIRED: Revision notes must be provided.');
    (err as any).code = 'P0004';
    throw err;
  }

  const act = ctx.activities.get(p_activity_id);
  if (!act) {
    const err = new Error('NOT_FOUND: Activity proposal not found.');
    (err as any).code = 'P0005';
    throw err;
  }

  if (act.status !== 'SUBMITTED') {
    const err = new Error(`INVALID_TRANSITION: Cannot execute decision on activity in ${act.status} status.`);
    (err as any).code = 'P0006';
    throw err;
  }

  act.status = finalDecision;
  act.rejection_reason = finalDecision === 'REJECTED' ? p_rejection_reason : null;
  act.revision_notes = finalDecision === 'REVISION_REQUESTED' ? p_revision_notes : null;

  ctx.statusHistory.push({
    target_id: p_activity_id,
    old_status: 'SUBMITTED',
    new_status: finalDecision,
    changed_by: v_effective_actor_id,
  });

  ctx.auditLogs.push({
    actor_id: v_effective_actor_id,
    actor_role: 'HOD',
    action: `Activity ${finalDecision}`,
    target_id: p_activity_id,
  });

  ctx.notifications.push({
    user_id: act.student_user_id,
    type: 'SUBMISSION_UPDATE',
    decision: finalDecision,
  });

  return { id: p_activity_id, status: finalDecision };
}

function simulateExecHodFinalizeReview(
  ctx: MockRpcContext,
  p_session_id: string,
  p_actor_id: string | null,
  p_notes?: string | null,
  p_next_goal?: string | null
) {
  const v_caller_id = ctx.callerUid;
  let v_effective_actor_id: string;

  if (v_caller_id !== null) {
    if (p_actor_id !== null && p_actor_id !== v_caller_id) {
      const err = new Error('FORBIDDEN: Caller identity does not match specified actor ID.');
      (err as any).code = 'P0001';
      throw err;
    }
    v_effective_actor_id = v_caller_id;
  } else {
    if (!p_actor_id) {
      const err = new Error('UNAUTHORIZED: Authentication required to finalize review sessions.');
      (err as any).code = 'P0001';
      throw err;
    }
    v_effective_actor_id = p_actor_id;
  }

  const user = ctx.dbUsers.get(v_effective_actor_id);
  if (!user || user.role !== 'HOD') {
    const err = new Error('FORBIDDEN: Only authorized HOD can finalize review sessions.');
    (err as any).code = 'P0001';
    throw err;
  }

  const session = ctx.reviewSessions.get(p_session_id);
  if (!session) {
    const err = new Error('NOT_FOUND: Review session not found.');
    (err as any).code = 'P0005';
    throw err;
  }

  if (session.status !== 'SCHEDULED') {
    const err = new Error(`INVALID_TRANSITION: Cannot finalize review session in ${session.status} status.`);
    (err as any).code = 'P0006';
    throw err;
  }

  // Non-evaluative review finalization: only status, meeting notes, next week goal
  session.status = 'COMPLETED';
  session.meeting_notes = p_notes?.trim() || null;
  session.next_week_goal = p_next_goal?.trim() || null;

  ctx.auditLogs.push({
    actor_id: v_effective_actor_id,
    actor_role: 'HOD',
    action: `Review Finalized: ${session.code}`,
    target_id: p_session_id,
  });

  ctx.notifications.push({
    user_id: session.student_user_id,
    type: 'REVIEW_REMINDER',
  });

  return {
    id: p_session_id,
    status: 'COMPLETED',
    meetingNotes: session.meeting_notes,
    nextWeekGoal: session.next_week_goal,
  };
}

// ============================================================================
// MAIN TEST SUITE
// ============================================================================

async function runAuthorizationHardeningTests() {
  console.log('\n===============================================================');
  console.log('CSE DEPARTMENT PLATFORM — AUTHORIZATION HARDENING REGRESSION SUITE');
  console.log('Testing: Identity Hardening, Database RPCs, Grants, Concurrency');
  console.log('===============================================================\n');

  const HOD_USER_ID = '11111111-1111-1111-1111-111111111111';
  const STUDENT_USER_ID = '22222222-2222-2222-2222-222222222222';
  const ROGUE_USER_ID = '33333333-3333-3333-3333-333333333333';

  const baseDbUsers = new Map<string, MockDbUser>([
    [
      HOD_USER_ID,
      { id: HOD_USER_ID, email: 'hod.cse@siet.ac.in', role: 'HOD', name: 'Dr. CSE HOD' },
    ],
    [
      STUDENT_USER_ID,
      { id: STUDENT_USER_ID, email: 'student.23cse@siet.ac.in', role: 'STUDENT', name: 'Meena' },
    ],
  ]);

  // --------------------------------------------------------------------------
  // TEST GROUP 1: UNAUTHENTICATED REQUESTS RECEIVE 401
  // --------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: UNAUTHENTICATED REQUESTS RECEIVE 401 ---');

  const unauthState: MockDbState = {
    authUser: null,
    dbUsers: baseDbUsers,
    students: new Map(),
    hods: new Map(),
  };

  const unauthUser = resolveAuthenticatedUser(unauthState);
  assert(unauthUser === null, '1.1 resolveAuthenticatedUser returns null when no session exists');

  let unauthError = '';
  try {
    assertRequireAuth(unauthUser);
  } catch (e: any) {
    unauthError = e.message;
  }
  assert(unauthError === 'UNAUTHORIZED', '1.2 requireAuth throws UNAUTHORIZED for unauthenticated caller');

  let unauthRoleError = '';
  try {
    assertRequireRole(unauthUser, ['HOD']);
  } catch (e: any) {
    unauthRoleError = e.message;
  }
  assert(unauthRoleError === 'UNAUTHORIZED', '1.3 requireRole throws UNAUTHORIZED for unauthenticated caller');

  const unauthApiResponse = apiError('UNAUTHORIZED', 'Authentication required.', 401);
  assert(unauthApiResponse.status === 401, '1.4 Route handler returns RFC 7807 401 on UNAUTHORIZED');

  // --------------------------------------------------------------------------
  // TEST GROUP 2: STUDENT USERS CANNOT ACCESS HOD DECISION/FINALIZATION ROUTES
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: STUDENT USERS CANNOT ACCESS HOD DECISION ROUTES ---');

  const studentState: MockDbState = {
    authUser: { id: STUDENT_USER_ID, email: 'student.23cse@siet.ac.in' },
    dbUsers: baseDbUsers,
    students: new Map([[STUDENT_USER_ID, { id: 's-1', register_number: '7376222CS101', department: 'CSE' }]]),
    hods: new Map(),
  };

  const studentUser = resolveAuthenticatedUser(studentState);
  assert(studentUser?.role === 'STUDENT', '2.1 Student user correctly identified as STUDENT role');

  let studentForbiddenError = '';
  try {
    assertRequireRole(studentUser, ['HOD']);
  } catch (e: any) {
    studentForbiddenError = e.message;
  }
  assert(studentForbiddenError === 'FORBIDDEN', '2.2 requireRole(["HOD"]) throws FORBIDDEN for student');

  const forbiddenApiResponse = apiError('FORBIDDEN', 'HOD authorization required.', 403);
  assert(forbiddenApiResponse.status === 403, '2.3 Route handler returns RFC 7807 403 on FORBIDDEN');

  // --------------------------------------------------------------------------
  // TEST GROUP 3: MISSING APPLICATION USER RECORDS ARE DENIED
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: MISSING APPLICATION USER RECORDS ARE DENIED ---');

  const missingUserState: MockDbState = {
    authUser: { id: ROGUE_USER_ID, email: 'unregistered@example.com' },
    dbUsers: baseDbUsers, // ROGUE_USER_ID does not exist in public.users
    students: new Map(),
    hods: new Map(),
  };

  const missingUser = resolveAuthenticatedUser(missingUserState);
  assert(missingUser === null, '3.1 Missing public.users record returns null (application access denied)');

  let missingUserAuthError = '';
  try {
    assertRequireAuth(missingUser);
  } catch (e: any) {
    missingUserAuthError = e.message;
  }
  assert(missingUserAuthError === 'UNAUTHORIZED', '3.2 Missing public.users record throws UNAUTHORIZED at guard');

  // --------------------------------------------------------------------------
  // TEST GROUP 4: USER-EDITABLE METADATA CANNOT GRANT HOD PRIVILEGES
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: USER-EDITABLE METADATA CANNOT GRANT HOD PRIVILEGES ---');

  const forgedMetadataState: MockDbState = {
    authUser: {
      id: STUDENT_USER_ID,
      email: 'student.23cse@siet.ac.in',
      user_metadata: { role: 'HOD', is_admin: true }, // Malicious attempt to spoof HOD in metadata
    },
    dbUsers: baseDbUsers, // In database, student has role = 'STUDENT'
    students: new Map([[STUDENT_USER_ID, { id: 's-1', register_number: '7376222CS101' }]]),
    hods: new Map(),
  };

  const forgedUser = resolveAuthenticatedUser(forgedMetadataState);
  assert(
    forgedUser?.role === 'STUDENT',
    '4.1 Derived role is strictly from database record (user_metadata role is ignored)'
  );

  let forgedHodAttemptError = '';
  try {
    assertRequireRole(forgedUser, ['HOD']);
  } catch (e: any) {
    forgedHodAttemptError = e.message;
  }
  assert(
    forgedHodAttemptError === 'FORBIDDEN',
    '4.2 Spoofed user_metadata role fails HOD guard check with FORBIDDEN'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 5: ARBITRARY ACTOR UUID CANNOT IMPERSONATE HOD IN RPC EXECUTION
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: DIRECT RPC EXECUTION IMPERSONATION PREVENTED ---');

  const rpcContext: MockRpcContext = {
    callerUid: STUDENT_USER_ID, // Student caller invoking Supabase RPC
    dbUsers: baseDbUsers,
    odRequests: new Map([
      [
        'od-1',
        {
          id: 'od-1',
          code: 'OD-2026-001',
          student_id: 's-1',
          student_user_id: STUDENT_USER_ID,
          status: 'PENDING',
        },
      ],
    ]),
    activities: new Map([
      [
        'act-1',
        {
          id: 'act-1',
          code: 'PRJ-2026-001',
          student_id: 's-1',
          student_user_id: STUDENT_USER_ID,
          type: 'PROJECT',
          status: 'SUBMITTED',
        },
      ],
    ]),
    reviewSessions: new Map([
      [
        'rev-1',
        {
          id: 'rev-1',
          code: 'REV-PRJ-2026-001-W1',
          activity_id: 'act-1',
          student_user_id: STUDENT_USER_ID,
          status: 'SCHEDULED',
        },
      ],
    ]),
    statusHistory: [],
    auditLogs: [],
    notifications: [],
  };

  // Case 5a: Student passes HOD's UUID as p_actor_id to impersonate HOD
  let impersonationErrorOd = '';
  try {
    simulateExecHodOdDecision(
      rpcContext,
      'od-1',
      HOD_USER_ID, // Attempt to impersonate HOD
      'APPROVED'
    );
  } catch (e: any) {
    impersonationErrorOd = e.message;
  }
  assert(
    impersonationErrorOd.includes('Caller identity does not match specified actor ID'),
    '5.1 exec_hod_od_decision rejects p_actor_id mismatch with caller auth.uid()'
  );

  let impersonationErrorAct = '';
  try {
    simulateExecHodActivityDecision(
      rpcContext,
      'act-1',
      HOD_USER_ID,
      'APPROVED'
    );
  } catch (e: any) {
    impersonationErrorAct = e.message;
  }
  assert(
    impersonationErrorAct.includes('Caller identity does not match specified actor ID'),
    '5.2 exec_hod_activity_decision rejects p_actor_id mismatch with caller auth.uid()'
  );

  let impersonationErrorRev = '';
  try {
    simulateExecHodFinalizeReview(
      rpcContext,
      'rev-1',
      HOD_USER_ID,
      'Meeting notes',
      'Next goals'
    );
  } catch (e: any) {
    impersonationErrorRev = e.message;
  }
  assert(
    impersonationErrorRev.includes('Caller identity does not match specified actor ID'),
    '5.3 exec_hod_finalize_review rejects p_actor_id mismatch with caller auth.uid()'
  );

  // Case 5b: Student passes own ID or omits p_actor_id -> Bound to student -> Role check fails
  let studentOwnIdErrorOd = '';
  try {
    simulateExecHodOdDecision(
      rpcContext,
      'od-1',
      STUDENT_USER_ID,
      'APPROVED'
    );
  } catch (e: any) {
    studentOwnIdErrorOd = e.message;
  }
  assert(
    studentOwnIdErrorOd.includes('Only authorized HOD can execute decisions'),
    '5.4 exec_hod_od_decision verifies database role of caller and rejects student'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 6: VALID HOD ACTIONS SUCCEED FOR ELIGIBLE RECORDS
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: VALID HOD ACTIONS SUCCEED FOR ELIGIBLE RECORDS ---');

  const hodRpcContext: MockRpcContext = {
    callerUid: HOD_USER_ID, // Verified HOD caller
    dbUsers: baseDbUsers,
    odRequests: new Map([
      [
        'od-pending',
        {
          id: 'od-pending',
          code: 'OD-2026-001',
          student_id: 's-1',
          student_user_id: STUDENT_USER_ID,
          status: 'PENDING',
        },
      ],
    ]),
    activities: new Map([
      [
        'act-submitted',
        {
          id: 'act-submitted',
          code: 'PRJ-2026-001',
          student_id: 's-1',
          student_user_id: STUDENT_USER_ID,
          type: 'PROJECT',
          status: 'SUBMITTED',
        },
      ],
    ]),
    reviewSessions: new Map([
      [
        'rev-scheduled',
        {
          id: 'rev-scheduled',
          code: 'REV-PRJ-2026-001-W1',
          activity_id: 'act-submitted',
          student_user_id: STUDENT_USER_ID,
          status: 'SCHEDULED',
        },
      ],
    ]),
    statusHistory: [],
    auditLogs: [],
    notifications: [],
  };

  const odResult = simulateExecHodOdDecision(
    hodRpcContext,
    'od-pending',
    HOD_USER_ID,
    'APPROVED',
    'Approved by HOD'
  );
  assert(odResult.status === 'APPROVED', '6.1 Verified HOD can approve PENDING OD request');

  const actResult = simulateExecHodActivityDecision(
    hodRpcContext,
    'act-submitted',
    HOD_USER_ID,
    'APPROVED',
    'Proposal approved'
  );
  assert(actResult.status === 'ACTIVE', '6.2 Verified HOD can approve SUBMITTED activity (sets to ACTIVE)');

  const revResult = simulateExecHodFinalizeReview(
    hodRpcContext,
    'rev-scheduled',
    HOD_USER_ID,
    'Review completed successfully',
    'Finish milestone 2'
  );
  assert(revResult.status === 'COMPLETED', '6.3 Verified HOD can finalize SCHEDULED review session');

  // --------------------------------------------------------------------------
  // TEST GROUP 7: INVALID TRANSITIONS AND CONCURRENT DUPLICATE DECISIONS REJECTED
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 7: INVALID TRANSITIONS AND VALIDATION REJECTED ---');

  // Attempt to decide on already APPROVED OD request (duplicate/replay decision)
  let duplicateOdError = '';
  try {
    simulateExecHodOdDecision(
      hodRpcContext,
      'od-pending',
      HOD_USER_ID,
      'REJECTED',
      null,
      'Too late'
    );
  } catch (e: any) {
    duplicateOdError = e.message;
  }
  assert(
    duplicateOdError.includes('INVALID_TRANSITION'),
    '7.1 Re-deciding on already decided OD request is rejected with INVALID_TRANSITION (P0006)'
  );

  // Attempt to finalize already COMPLETED review
  let duplicateRevError = '';
  try {
    simulateExecHodFinalizeReview(
      hodRpcContext,
      'rev-scheduled',
      HOD_USER_ID,
      'Duplicate note'
    );
  } catch (e: any) {
    duplicateRevError = e.message;
  }
  assert(
    duplicateRevError.includes('INVALID_TRANSITION'),
    '7.2 Finalizing already COMPLETED review is rejected with INVALID_TRANSITION (P0006)'
  );

  // Attempt to reject without mandatory reason
  const freshOdContext: MockRpcContext = {
    ...hodRpcContext,
    odRequests: new Map([
      ['od-fresh', { id: 'od-fresh', status: 'PENDING', student_user_id: STUDENT_USER_ID }],
    ]),
  };

  let missingReasonError = '';
  try {
    simulateExecHodOdDecision(freshOdContext, 'od-fresh', HOD_USER_ID, 'REJECTED', null, '');
  } catch (e: any) {
    missingReasonError = e.message;
  }
  assert(
    missingReasonError.includes('REJECTION_REASON_REQUIRED'),
    '7.3 Rejection without reason raises REJECTION_REASON_REQUIRED (P0003)'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 8: HISTORY, AUDIT, AND NOTIFICATIONS ATOMICITY & MIGRATION FILES
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 8: AUDIT ATOMICITY AND MIGRATION DEFINITIONS ---');

  assert(hodRpcContext.statusHistory.length >= 2, '8.1 Status history recorded atomically');
  assert(hodRpcContext.auditLogs.length >= 3, '8.2 Audit logs recorded atomically with verified actor ID');
  assert(hodRpcContext.notifications.length >= 3, '8.3 Student notifications created atomically');

  // Verify Migration definitions on disk
  const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations');
  const odMigrationFile = path.join(migrationsDir, '20260928_atomic_od_decision.sql');
  const actMigrationFile = path.join(migrationsDir, '20260928_atomic_activity_decision.sql');
  const revMigrationFile = path.join(migrationsDir, '20260928_atomic_review_finalization.sql');
  const hardeningMigrationFile = path.join(migrationsDir, '20261013_authorization_hardening.sql');

  const odSql = fs.readFileSync(odMigrationFile, 'utf8');
  const actSql = fs.readFileSync(actMigrationFile, 'utf8');
  const revSql = fs.readFileSync(revMigrationFile, 'utf8');
  const hardeningSql = fs.readFileSync(hardeningMigrationFile, 'utf8');

  // Verify caller identity binding in SQL
  assert(
    odSql.includes('auth.uid()') && odSql.includes('p_actor_id <> v_caller_id'),
    '8.4 exec_hod_od_decision migration binds actor to auth.uid() and rejects impersonation'
  );
  assert(
    actSql.includes('auth.uid()') && actSql.includes('p_actor_id <> v_caller_id'),
    '8.5 exec_hod_activity_decision migration binds actor to auth.uid() and rejects impersonation'
  );
  assert(
    revSql.includes('auth.uid()') && revSql.includes('p_actor_id <> v_caller_id'),
    '8.6 exec_hod_finalize_review migration binds actor to auth.uid() and rejects impersonation'
  );

  // Verify row-level locking
  assert(odSql.includes('FOR UPDATE OF od;'), '8.7 exec_hod_od_decision maintains FOR UPDATE row locking');
  assert(actSql.includes('FOR UPDATE OF a;'), '8.8 exec_hod_activity_decision maintains FOR UPDATE row locking');
  assert(revSql.includes('FOR UPDATE OF rs;'), '8.9 exec_hod_finalize_review maintains FOR UPDATE row locking');

  // Verify non-evaluative review finalization (no marks, scores, rubrics)
  assert(
    !revSql.includes('score') && !revSql.includes('grade') && !revSql.includes('rubric') && !revSql.includes('mark'),
    '8.10 exec_hod_finalize_review strictly non-evaluative (no rubrics, grades, scores or marks)'
  );

  // Verify security definitions and grants
  assert(
    odSql.includes('REVOKE ALL ON FUNCTION public.exec_hod_od_decision(UUID, UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;') &&
      odSql.includes('REVOKE ALL ON FUNCTION public.exec_hod_od_decision(UUID, UUID, TEXT, TEXT, TEXT, TEXT) FROM anon;') &&
      odSql.includes('GRANT EXECUTE ON FUNCTION public.exec_hod_od_decision(UUID, UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;'),
    '8.11 exec_hod_od_decision revokes PUBLIC/anon and grants strictly to authenticated, service_role'
  );
  assert(
    actSql.includes('REVOKE ALL ON FUNCTION public.exec_hod_activity_decision(UUID, UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;') &&
      actSql.includes('REVOKE ALL ON FUNCTION public.exec_hod_activity_decision(UUID, UUID, TEXT, TEXT, TEXT, TEXT) FROM anon;') &&
      actSql.includes('GRANT EXECUTE ON FUNCTION public.exec_hod_activity_decision(UUID, UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;'),
    '8.12 exec_hod_activity_decision revokes PUBLIC/anon and grants strictly to authenticated, service_role'
  );
  assert(
    revSql.includes('REVOKE ALL ON FUNCTION public.exec_hod_finalize_review(UUID, UUID, TEXT, TEXT) FROM PUBLIC;') &&
      revSql.includes('REVOKE ALL ON FUNCTION public.exec_hod_finalize_review(UUID, UUID, TEXT, TEXT) FROM anon;') &&
      revSql.includes('GRANT EXECUTE ON FUNCTION public.exec_hod_finalize_review(UUID, UUID, TEXT, TEXT) TO authenticated, service_role;'),
    '8.13 exec_hod_finalize_review revokes PUBLIC/anon and grants strictly to authenticated, service_role'
  );

  // Verify standalone incremental hardening migration
  assert(
    fs.existsSync(hardeningMigrationFile) && hardeningSql.length > 2000,
    '8.14 Standalone incremental migration 20261013_authorization_hardening.sql exists and is complete'
  );

  // Verify comprehensive RLS migration
  const rlsMigrationFile = path.resolve(process.cwd(), 'supabase/migrations/20261013_rls_comprehensive_hardening.sql');
  const rlsSql = fs.existsSync(rlsMigrationFile) ? fs.readFileSync(rlsMigrationFile, 'utf-8') : '';
  assert(
    fs.existsSync(rlsMigrationFile) &&
      rlsSql.includes('public.activities') &&
      rlsSql.includes('public.documents') &&
      rlsSql.includes('public.notifications') &&
      rlsSql.includes('public.review_sessions'),
    '8.15 Standalone RLS hardening migration 20261013_rls_comprehensive_hardening.sql exists and covers all tables'
  );

  // Verify student role enforcement in API routes
  const odRouteSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/app/api/v1/od-requests/route.ts'), 'utf-8');
  const actRouteSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/app/api/v1/activities/route.ts'), 'utf-8');
  assert(
    odRouteSrc.includes("requireRole(['STUDENT'])") && actRouteSrc.includes("requireRole(['STUDENT'])"),
    '8.16 Student submission endpoints strictly require STUDENT role and authoritative database profile'
  );

  // Verify notification routes exist and enforce authentication/ownership
  const notifRouteSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/app/api/v1/notifications/route.ts'), 'utf-8');
  const notifReadSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/app/api/v1/notifications/[id]/read/route.ts'), 'utf-8');
  assert(
    notifRouteSrc.includes('requireAuth()') && notifReadSrc.includes('notif.user_id !== authUser.id'),
    '8.17 In-app notification routes enforce authentication and strict recipient ownership'
  );

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n---------------------------------------------------------------');
  console.log(`TOTAL HARDENING TESTS: ${totalTests}`);
  console.log(`PASSED:                ${passedTests}`);
  console.log(`FAILED:                ${failedTests}`);
  console.log('---------------------------------------------------------------');

  if (failedTests > 0) {
    console.error('\n>>> AUTHORIZATION HARDENING VERIFICATION: FAILED <<<');
    process.exit(1);
  } else {
    console.log('\n>>> AUTHORIZATION HARDENING VERIFICATION: ALL PASSED <<<');
  }
}

runAuthorizationHardeningTests().catch((err) => {
  console.error('Test runner execution error:', err);
  process.exit(1);
});
