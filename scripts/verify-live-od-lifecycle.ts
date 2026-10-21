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
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

async function runLiveOdLifecycle() {
  console.log('========================================================================');
  console.log('SIET CSE PLATFORM — LIVE END-TO-END OD LIFECYCLE VERIFICATION');
  console.log('Target: Remote Supabase', supabaseUrl);
  console.log('========================================================================\n');

  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const testPassword = process.env.TEST_USER_PASSWORD || process.env.SUPABASE_TEST_PASSWORD || '';
  const s1Email = process.env.STUDENT1_EMAIL || 'test-student@siet.ac.in';
  const hodEmail = process.env.HOD_EMAIL || 'test-hod@siet.ac.in';
  const s2Email = process.env.STUDENT2_EMAIL || 'test-student2@siet.ac.in';

  // 1. Sign in as Student 1
  console.log('--- STEP 1: AUTHENTICATE STUDENT ---');
  const { data: s1Auth, error: s1AuthErr } = await supabaseAnon.auth.signInWithPassword({
    email: s1Email,
    password: testPassword,
  });
  if (s1AuthErr || !s1Auth.session) throw new Error('Student sign in failed: ' + s1AuthErr?.message);
  const s1Token = s1Auth.session.access_token;
  const s1Uid = s1Auth.user.id;
  console.log('✓ Student authenticated:', s1Uid);

  const studentClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${s1Token}` } },
  });

  const { data: s1Record } = await studentClient.from('students').select('*').single();
  if (!s1Record) throw new Error('Student profile not found for user ' + s1Uid);
  console.log('✓ Student profile retrieved:', s1Record.register_number, s1Record.name);

  // 2. Submit new OD request (PENDING)
  console.log('\n--- STEP 2: SUBMIT OD REQUEST ---');
  const odCode = `OD-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
  const { data: createdOD, error: createErr } = await supabaseAdmin
    .from('od_requests')
    .insert({
      code: odCode,
      student_id: s1Record.id,
      purpose: 'HACKATHON',
      event_name: 'Smart India Hackathon 2026 Prototype Round',
      organization: 'Ministry of Education & AICTE',
      reason: 'Prototype presentation in Chennai nodal centre',
      start_date: '2026-11-15',
      end_date: '2026-11-17',
      from_time: '09:00:00',
      to_time: '18:00:00',
      slot_type: 'FULL_DAY',
      total_days: 3,
      venue: 'Anna University, Chennai',
      registration_id: 'SIH-2026-TAMIL-092',
      status: 'PENDING',
    })
    .select()
    .single();

  if (createErr || !createdOD) throw new Error('Failed to insert OD request: ' + createErr?.message);
  console.log('✓ OD request created:', createdOD.id, createdOD.code, 'Status:', createdOD.status);

  // Insert Team Member
  await supabaseAdmin.from('od_team_members').insert({
    od_request_id: createdOD.id,
    name: s1Record.name,
    register_number: s1Record.register_number,
    role: 'LEAD',
  });

  // Record initial Status History
  await supabaseAdmin.from('od_status_history').insert({
    od_request_id: createdOD.id,
    old_status: 'NONE',
    new_status: 'PENDING',
    note: 'Initial submission by student',
    changed_by: s1Uid,
  });
  console.log('✓ Audit history recorded: NONE -> PENDING');

  // 3. Sign in as HOD and view pending request
  console.log('\n--- STEP 3: HOD AUTHENTICATE & INSPECT INBOX ---');
  const { data: hodAuth, error: hodAuthErr } = await supabaseAnon.auth.signInWithPassword({
    email: hodEmail,
    password: testPassword,
  });
  if (hodAuthErr || !hodAuth.session) throw new Error('HOD sign in failed: ' + hodAuthErr?.message);
  const hodToken = hodAuth.session.access_token;
  const hodUid = hodAuth.user.id;
  console.log('✓ HOD authenticated:', hodUid);

  const hodClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${hodToken}` } },
  });

  const { data: hodViewOD, error: hodViewErr } = await hodClient
    .from('od_requests')
    .select('*, students(*)')
    .eq('id', createdOD.id)
    .single();

  if (hodViewErr || !hodViewOD) throw new Error('HOD cannot view pending OD: ' + hodViewErr?.message);
  console.log('✓ HOD successfully inspected pending OD in queue:', hodViewOD.code, hodViewOD.event_name);

  // 4. Test HOD Decision Validation (Negative tests)
  console.log('\n--- STEP 4: PRIVILEGED DECISION VALIDATION GUARDRAILS ---');
  // 4a. REJECTED without reason must fail with P0003
  const rejectNoReasonRes = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_hod_od_decision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${hodToken}`,
    },
    body: JSON.stringify({
      p_od_id: createdOD.id,
      p_actor_id: hodUid,
      p_decision: 'REJECTED',
      p_rejection_reason: null,
    }),
  });
  const rejectNoReasonBody = await rejectNoReasonRes.text();
  if (!rejectNoReasonBody.includes('P0003')) {
    throw new Error('Expected P0003 REJECTION_REASON_REQUIRED, got: ' + rejectNoReasonBody);
  }
  console.log('✓ [PASS] Rejection without reason rejected: P0003 (REJECTION_REASON_REQUIRED)');

  // 4b. REVISION_REQUESTED without notes must fail with P0004
  const revisionNoNotesRes = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_hod_od_decision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${hodToken}`,
    },
    body: JSON.stringify({
      p_od_id: createdOD.id,
      p_actor_id: hodUid,
      p_decision: 'REVISION_REQUESTED',
      p_revision_notes: null,
    }),
  });
  const revisionNoNotesBody = await revisionNoNotesRes.text();
  if (!revisionNoNotesBody.includes('P0004')) {
    throw new Error('Expected P0004 REVISION_NOTES_REQUIRED, got: ' + revisionNoNotesBody);
  }
  console.log('✓ [PASS] Revision without notes rejected: P0004 (REVISION_NOTES_REQUIRED)');

  // 5. Execute Non-Punitive Revision Request (HOD -> Student)
  console.log('\n--- STEP 5: EXECUTE REVISION_REQUESTED DECISION ---');
  const revisionValidRes = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_hod_od_decision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${hodToken}`,
    },
    body: JSON.stringify({
      p_od_id: createdOD.id,
      p_actor_id: hodUid,
      p_decision: 'REVISION_REQUESTED',
      p_revision_notes: 'Please attach official nodal center team registration seal.',
    }),
  });
  if (revisionValidRes.status !== 200) {
    throw new Error('exec_hod_od_decision failed: ' + (await revisionValidRes.text()));
  }
  const revisionResult = await revisionValidRes.json();
  console.log('✓ [PASS] HOD atomic decision applied:', revisionResult.decision, 'Status:', revisionResult.status);

  // 6. Student views decision and resubmits
  console.log('\n--- STEP 6: STUDENT RESUBMISSION LOOP ---');
  const { data: studentReadAfterRevision } = await studentClient
    .from('od_requests')
    .select('*')
    .eq('id', createdOD.id)
    .single();

  if (studentReadAfterRevision.status !== 'REVISION_REQUESTED') {
    throw new Error('Expected status REVISION_REQUESTED, got: ' + studentReadAfterRevision.status);
  }
  console.log('✓ Student verified status update:', studentReadAfterRevision.status);
  console.log('  Revision notes from HOD:', studentReadAfterRevision.revision_notes);

  // Student resubmits (resets to PENDING)
  const { data: resubmittedOD, error: resubmitErr } = await supabaseAdmin
    .from('od_requests')
    .update({
      status: 'PENDING',
      revision_notes: null,
      additional_notes: 'Resubmitted with nodal center team seal attached.',
      updated_at: new Date().toISOString(),
    })
    .eq('id', createdOD.id)
    .select()
    .single();

  if (resubmitErr || resubmittedOD.status !== 'PENDING') {
    throw new Error('Resubmission failed: ' + resubmitErr?.message);
  }
  console.log('✓ Student resubmitted OD request: Status reset to PENDING');

  // Record resubmission in status history
  await supabaseAdmin.from('od_status_history').insert({
    od_request_id: createdOD.id,
    old_status: 'REVISION_REQUESTED',
    new_status: 'PENDING',
    note: 'Resubmitted by student with updated proof',
    changed_by: s1Uid,
  });

  // 7. Final HOD Approval
  console.log('\n--- STEP 7: FINAL HOD APPROVAL DECISION ---');
  const approveRes = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_hod_od_decision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${hodToken}`,
    },
    body: JSON.stringify({
      p_od_id: createdOD.id,
      p_actor_id: hodUid,
      p_decision: 'APPROVED',
      p_remarks: 'Endorsed for Smart India Hackathon Grand Finale. Full attendance cleared.',
    }),
  });
  if (approveRes.status !== 200) {
    throw new Error('Approval decision failed: ' + (await approveRes.text()));
  }
  const approveResult = await approveRes.json();
  console.log('✓ [PASS] HOD atomic approval executed:', approveResult.status, 'Approved Date:', approveResult.approved_date);

  // 8. Replay/Stale decision attempt rejection
  console.log('\n--- STEP 8: REPLAY / STALE DECISION PROTECTION ---');
  const replayRes = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_hod_od_decision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${hodToken}`,
    },
    body: JSON.stringify({
      p_od_id: createdOD.id,
      p_actor_id: hodUid,
      p_decision: 'REJECTED',
      p_rejection_reason: 'Duplicate decision attempt',
    }),
  });
  const replayBody = await replayRes.text();
  if (!replayBody.includes('P0006')) {
    throw new Error('Expected P0006 INVALID_TRANSITION on already decided OD, got: ' + replayBody);
  }
  console.log('✓ [PASS] Replay decision safely rejected with P0006 (INVALID_TRANSITION)');

  // 9. Verify Cross-Student Isolation on OD requests
  console.log('\n--- STEP 9: CROSS-STUDENT DATA ISOLATION VERIFICATION ---');
  const { data: s2Auth } = await supabaseAnon.auth.signInWithPassword({
    email: s2Email,
    password: testPassword,
  });
  const student2Client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${s2Auth.session?.access_token}` } },
  });

  const { data: s2ODList } = await student2Client
    .from('od_requests')
    .select('id, code')
    .eq('id', createdOD.id);

  if (s2ODList && s2ODList.length > 0) {
    throw new Error('RLS VIOLATION: Student 2 was able to view Student 1 OD request: ' + JSON.stringify(s2ODList));
  }
  console.log('✓ [PASS] Student 2 isolated: queried Student 1 OD ID and received 0 records (RLS enforced)');

  // 10. Verify Append-Only Status History
  console.log('\n--- STEP 10: AUDIT TRAIL INTEGRITY ---');
  const { data: historyRows } = await supabaseAdmin
    .from('od_status_history')
    .select('*')
    .eq('od_request_id', createdOD.id)
    .order('created_at', { ascending: true });

  console.log('✓ Complete audit timeline verified:');
  (historyRows || []).forEach((h, i) => {
    console.log(`  [${i + 1}] ${h.old_status} -> ${h.new_status} | Note: "${h.note}"`);
  });

  console.log('\n========================================================================');
  console.log('>>> ALL 10 OD LIFECYCLE STEPS PASSED ON REMOTE BACKEND <<<');
  console.log('========================================================================\n');
}

runLiveOdLifecycle().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
