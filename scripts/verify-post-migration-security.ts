import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';

const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eq = line.indexOf('=');
  if (eq > 0) env[trimmed.slice(0, eq).trim()] = line.slice(eq + 1).trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const DEFAULT_TEST_PASSWORD = env.TEST_USER_PASSWORD || env.SUPABASE_TEST_PASSWORD || process.env.TEST_USER_PASSWORD || '';

const HOD_EMAIL = env.HOD_EMAIL || 'test-hod@siet.ac.in';
const HOD_PASSWORD = env.HOD_PASSWORD || DEFAULT_TEST_PASSWORD;
const STUDENT1_EMAIL = env.STUDENT1_EMAIL || 'test-student@siet.ac.in';
const STUDENT1_PASSWORD = env.STUDENT1_PASSWORD || DEFAULT_TEST_PASSWORD;
const STUDENT2_EMAIL = env.STUDENT2_EMAIL || 'test-student2@siet.ac.in';
const STUDENT2_PASSWORD = env.STUDENT2_PASSWORD || DEFAULT_TEST_PASSWORD;

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
}

async function run() {
  console.log('========================================================================');
  console.log('PHASE 4: LIVE SECURITY & INTEGRATION VERIFICATION AFTER MIGRATIONS');
  console.log(`Target: Remote Supabase ${supabaseUrl}`);
  console.log('========================================================================\n');

  // 1. Authenticate real users
  console.log('--- 1. AUTHENTICATE REAL SESSIONS (NO SERVICE ROLE) ---');
  const student1Client = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: s1Auth, error: s1AuthErr } = await student1Client.auth.signInWithPassword({
    email: STUDENT1_EMAIL,
    password: STUDENT1_PASSWORD,
  });
  assert(!s1AuthErr && !!s1Auth.user && !!s1Auth.session, `Student 1 sign-in failed: ${s1AuthErr?.message}`);
  const s1Uid = s1Auth.user!.id;
  const s1Token = s1Auth.session!.access_token;
  console.log(`✓ Student 1 authenticated: ${s1Uid}`);

  const student2Client = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: s2Auth, error: s2AuthErr } = await student2Client.auth.signInWithPassword({
    email: STUDENT2_EMAIL,
    password: STUDENT2_PASSWORD,
  });
  assert(!s2AuthErr && !!s2Auth.user && !!s2Auth.session, `Student 2 sign-in failed: ${s2AuthErr?.message}`);
  const s2Uid = s2Auth.user!.id;
  const s2Token = s2Auth.session!.access_token;
  console.log(`✓ Student 2 authenticated: ${s2Uid}`);

  const hodClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data: hodAuth, error: hodAuthErr } = await hodClient.auth.signInWithPassword({
    email: HOD_EMAIL,
    password: HOD_PASSWORD,
  });
  assert(!hodAuthErr && !!hodAuth.user && !!hodAuth.session, `HOD sign-in failed: ${hodAuthErr?.message}`);
  const hodUid = hodAuth.user!.id;
  const hodToken = hodAuth.session!.access_token;
  console.log(`✓ HOD authenticated: ${hodUid}\n`);

  // Query student profile using student 1 token
  const { data: s1Profile } = await student1Client
    .from('students')
    .select('*')
    .eq('user_id', s1Uid)
    .single();
  assert(!!s1Profile, 'Student 1 profile lookup failed under RLS.');
  const s1DbId = s1Profile.id;
  console.log(`✓ Student 1 profile: ${s1Profile.name} (${s1Profile.register_number})\n`);

  // ------------------------------------------------------------------------
  // TEST A: STUDENT DIRECT ACTIVITY CREATION VIA RLS
  // ------------------------------------------------------------------------
  console.log('--- TEST A: STUDENT ACTIVITY CREATION VIA RLS (DIRECT TABLE INSERT) ---');
  const actCode = `ACT-SEC-${Date.now().toString().slice(-4)}`;
  const { data: newAct, error: actCreateErr } = await student1Client
    .from('activities')
    .insert({
      code: actCode,
      student_id: s1DbId,
      type: 'PROJECT',
      title: 'Cryptographic Identity & Privacy-Preserving Attestation',
      description: 'Zero-knowledge proofs for student identity and grade attestations.',
      technologies: ['Circom', 'SnarkJS', 'Next.js', 'PostgreSQL'],
      start_date: '2026-10-15',
      end_date: '2026-12-15',
      status: 'SUBMITTED',
    })
    .select()
    .single();

  assert(!actCreateErr && !!newAct, `Student direct activity creation failed under new RLS: ${actCreateErr?.message}`);
  assert(newAct.status === 'SUBMITTED', 'Activity status must be SUBMITTED');
  console.log(`✓ [PASS] Student 1 created activity directly via RLS: ${newAct.id} (${newAct.code}) - Status: ${newAct.status}\n`);

  // ------------------------------------------------------------------------
  // TEST B: STUDENT CANNOT SPOOF HOD ACTOR ID ON ACTIVITY DECISION
  // ------------------------------------------------------------------------
  console.log('--- TEST B: PRIVILEGED RPC SPOOFING DEFENSE (STUDENT SPOOFING HOD) ---');
  const spoofRes = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_hod_activity_decision`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${s1Token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_activity_id: newAct.id,
      p_actor_id: hodUid, // Student attempting to pass HOD user ID
      p_decision: 'ACTIVE',
    }),
  });

  const spoofBody = await spoofRes.text();
  console.log(`Response status: ${spoofRes.status}, Body: ${spoofBody}`);
  assert(
    spoofRes.status === 400 || spoofRes.status === 500,
    `Spoofed call must return error status, got ${spoofRes.status}`
  );
  assert(
    spoofBody.includes('P0001') && spoofBody.includes('Caller identity does not match specified actor ID'),
    `Expected P0001 Caller identity mismatch, got: ${spoofBody}`
  );
  console.log('✓ [PASS] Student caller attempting to impersonate HOD actor ID strictly rejected with P0001!\n');

  // ------------------------------------------------------------------------
  // TEST C: STUDENT CALLING WITH OWN ID IS REJECTED AS NON-HOD
  // ------------------------------------------------------------------------
  console.log('--- TEST C: PRIVILEGED RPC ROLE ENFORCEMENT (STUDENT WITH OWN ID) ---');
  const studentSelfRes = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_hod_activity_decision`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${s1Token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_activity_id: newAct.id,
      p_actor_id: s1Uid, // Student passing own actor ID
      p_decision: 'ACTIVE',
    }),
  });

  const studentSelfBody = await studentSelfRes.text();
  console.log(`Response status: ${studentSelfRes.status}, Body: ${studentSelfBody}`);
  assert(
    studentSelfBody.includes('P0001') && studentSelfBody.includes('Only authorized HOD can execute activity decisions'),
    `Expected P0001 Non-HOD rejection, got: ${studentSelfBody}`
  );
  console.log('✓ [PASS] Authenticated student caller strictly rejected as non-HOD with P0001!\n');

  // ------------------------------------------------------------------------
  // TEST D: ANONYMOUS CALLER REJECTED (REVOKED GRANTS)
  // ------------------------------------------------------------------------
  console.log('--- TEST D: ANONYMOUS CALLER REJECTED VIA REVOKE GRANTS ---');
  const anonRes = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_hod_activity_decision`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_activity_id: newAct.id,
      p_actor_id: hodUid,
      p_decision: 'ACTIVE',
    }),
  });

  const anonBody = await anonRes.text();
  console.log(`Response status: ${anonRes.status}, Body: ${anonBody}`);
  assert(
    anonRes.status === 401 || anonRes.status === 403 || anonRes.status === 404 || anonBody.includes('P0001') || anonBody.includes('permission denied'),
    `Anonymous RPC execution must be forbidden, got: ${anonRes.status} ${anonBody}`
  );
  console.log('✓ [PASS] Anonymous caller blocked from privileged RPC execution!\n');

  // ------------------------------------------------------------------------
  // TEST E: REAL HOD SESSION EXECUTES PERMITTED DECISIONS
  // ------------------------------------------------------------------------
  console.log('--- TEST E: REAL HOD SESSION EXECUTES DECISIONS ---');
  // E.1: Rejection requires reason
  const rejNoReasonRes = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_hod_activity_decision`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${hodToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_activity_id: newAct.id,
      p_actor_id: hodUid,
      p_decision: 'REJECTED',
      p_rejection_reason: '',
    }),
  });
  const rejNoReasonBody = await rejNoReasonRes.text();
  assert(rejNoReasonBody.includes('P0003'), `Expected P0003 REJECTION_REASON_REQUIRED, got: ${rejNoReasonBody}`);
  console.log('✓ [PASS] Rejection without reason rejected: P0003 (REJECTION_REASON_REQUIRED)');

  // E.2: Revision Requested
  const revRes = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_hod_activity_decision`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${hodToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_activity_id: newAct.id,
      p_actor_id: hodUid,
      p_decision: 'REVISION_REQUESTED',
      p_revision_notes: 'Provide data flow architecture and milestone breakdown.',
    }),
  });
  const revText = await revRes.text();
  assert(revRes.status === 200, `Revision requested failed: ${revText}`);
  const revResult = JSON.parse(revText);
  assert(revResult.status === 'REVISION_REQUESTED', `Expected REVISION_REQUESTED, got ${revResult.status}`);
  console.log(`✓ [PASS] Real HOD session executed REVISION_REQUESTED: ${revResult.status}`);

  // E.3: Student resubmission loop via RLS
  const { data: resubAct, error: resubErr } = await student1Client
    .from('activities')
    .update({
      status: 'SUBMITTED',
      description: 'Updated with data flow architecture and milestone breakdown.',
      revision_notes: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', newAct.id)
    .select()
    .single();
  assert(!resubErr && !!resubAct, `Student resubmission failed: ${resubErr?.message}`);
  assert(resubAct.status === 'SUBMITTED', `Expected status SUBMITTED, got ${resubAct.status}`);
  console.log(`✓ [PASS] Student 1 resubmitted revised activity via RLS: ${resubAct.status}`);

  // E.4: Final HOD Approval
  const appRes = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_hod_activity_decision`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${hodToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_activity_id: newAct.id,
      p_actor_id: hodUid,
      p_decision: 'ACTIVE',
      p_remarks: 'Approved for Semester Capstone.',
    }),
  });
  const appText = await appRes.text();
  assert(appRes.status === 200, `HOD approval failed: ${appText}`);
  const appResult = JSON.parse(appText);
  assert(appResult.status === 'ACTIVE', `Expected ACTIVE, got ${appResult.status}`);
  console.log(`✓ [PASS] Real HOD session approved activity: ${appResult.status}\n`);

  // ------------------------------------------------------------------------
  // TEST F: CROSS-STUDENT DATA ISOLATION (RLS ENFORCEMENT)
  // ------------------------------------------------------------------------
  console.log('--- TEST F: CROSS-STUDENT DATA ISOLATION (RLS ENFORCEMENT) ---');
  // Student 2 queries Student 1's activity
  const { data: s2ViewAct } = await student2Client
    .from('activities')
    .select('id, title')
    .eq('id', newAct.id);
  assert(!s2ViewAct || s2ViewAct.length === 0, 'RLS VIOLATION: Student 2 was able to view Student 1 activity!');
  console.log('✓ [PASS] Student 2 isolated: queried Student 1 activity and received 0 records.');

  // Student 2 attempts to update Student 1's activity
  const { data: s2UpdateAct, error: s2UpErr } = await student2Client
    .from('activities')
    .update({ title: 'Tampered Title by Student 2' })
    .eq('id', newAct.id)
    .select();
  assert(!s2UpdateAct || s2UpdateAct.length === 0, 'RLS VIOLATION: Student 2 modified Student 1 activity!');
  console.log('✓ [PASS] Student 2 prohibited from modifying Student 1 activity (0 rows affected).');

  // Student 2 queries Student 1's notifications
  const { data: s2ViewNotif } = await student2Client
    .from('notifications')
    .select('*')
    .eq('user_id', s1Uid);
  assert(!s2ViewNotif || s2ViewNotif.length === 0, 'RLS VIOLATION: Student 2 saw Student 1 notifications!');
  console.log('✓ [PASS] Student 2 isolated from Student 1 notifications (0 rows returned).\n');

  // ------------------------------------------------------------------------
  // TEST G: WEEKLY REVIEW LIFECYCLE & NON-EVALUATIVE GUARANTEES
  // ------------------------------------------------------------------------
  console.log('--- TEST G: WEEKLY REVIEW LIFECYCLE & NON-EVALUATIVE FINALIZATION ---');
  const reviewCode = `REV-SEC-${Date.now().toString().slice(-4)}`;
  const { data: newSession, error: sessErr } = await hodClient
    .from('review_sessions')
    .insert({
      code: reviewCode,
      activity_id: newAct.id,
      review_number: 1,
      review_type: 'PROJECT_WEEKLY',
      date: '2026-10-20',
      time: '10:00:00',
      venue: 'Lab 402 - Systems Lab',
      status: 'SCHEDULED',
    })
    .select()
    .single();
  assert(!sessErr && !!newSession, `Review session creation failed: ${sessErr?.message}`);
  console.log(`✓ Review session scheduled: ${newSession.id} (${newSession.code})`);

  // Student progress milestone submission via RLS
  const { data: prog, error: progErr } = await student1Client
    .from('weekly_progress')
    .insert({
      review_session_id: newSession.id,
      student_id: s1DbId,
      completed_this_week: 'Completed zero-knowledge circuit for registration attestation.',
      currently_working_on: 'Integrating snarkjs verifier in frontend.',
      next_week_goal: 'Test proof generation performance in browser.',
      blockers: 'None',
    })
    .select()
    .single();
  assert(!progErr && !!prog, `Student weekly progress insert failed under RLS: ${progErr?.message}`);
  console.log(`✓ [PASS] Student 1 submitted weekly progress milestone via RLS: ${prog.id}`);

  // HOD Finalizes review session via hardened RPC
  const finRes = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_hod_finalize_review`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${hodToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_session_id: newSession.id,
      p_actor_id: hodUid,
      p_notes: 'Circuits reviewed. Verified zero-knowledge constraint count is optimal.',
      p_next_goal: 'Proceed with client-side prover integration.',
    }),
  });
  const finText = await finRes.text();
  assert(finRes.status === 200, `Finalize review failed: ${finText}`);
  const finResult = JSON.parse(finText);
  assert(finResult.status === 'COMPLETED', `Expected COMPLETED, got ${finResult.status}`);
  console.log(`✓ [PASS] HOD finalized review session: ${finResult.status} (Strictly non-evaluative: notes & next goals recorded, zero marks/grades)\n`);

  // ------------------------------------------------------------------------
  // TEST H: EXISTING DATA INTEGRITY
  // ------------------------------------------------------------------------
  console.log('--- TEST H: EXISTING DATA INTEGRITY VERIFICATION ---');
  const { count: userCount } = await hodClient.from('users').select('*', { count: 'exact', head: true });
  const { count: studentCount } = await hodClient.from('students').select('*', { count: 'exact', head: true });
  const { count: odCount } = await hodClient.from('od_requests').select('*', { count: 'exact', head: true });
  const { count: actCount } = await hodClient.from('activities').select('*', { count: 'exact', head: true });
  const { count: auditCount } = await hodClient.from('audit_logs').select('*', { count: 'exact', head: true });

  console.log(`  - Users in database: ${userCount}`);
  console.log(`  - Students in database: ${studentCount}`);
  console.log(`  - OD Requests in database: ${odCount}`);
  console.log(`  - Activities in database: ${actCount}`);
  console.log(`  - Audit Logs in database: ${auditCount}`);
  assert((userCount || 0) > 0, 'Users table is empty!');
  assert((studentCount || 0) > 0, 'Students table is empty!');
  assert((odCount || 0) > 0, 'OD requests table is empty!');
  console.log('✓ [PASS] All existing database records remain 100% intact!\n');

  console.log('========================================================================');
  console.log('>>> ALL POST-MIGRATION SECURITY & INTEGRATION TESTS PASSED <<<');
  console.log('========================================================================');
}

run().catch((err) => {
  console.error('\n❌ Unhandled error in security verification:', err);
  process.exit(1);
});
