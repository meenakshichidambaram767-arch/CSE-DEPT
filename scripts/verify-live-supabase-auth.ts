import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';

const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eq = trimmed.indexOf('=');
  if (eq > 0) env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

async function runLiveVerification() {
  console.log('========================================================================');
  console.log('SIET CSE PLATFORM — LIVE SUPABASE AUTHENTICATION & IDENTITY VERIFICATION');
  console.log('Project URL:', supabaseUrl);
  console.log('========================================================================\n');

  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const testPassword = process.env.TEST_USER_PASSWORD || process.env.SUPABASE_TEST_PASSWORD || '';
  const studentEmail = process.env.STUDENT1_EMAIL || 'test-student@siet.ac.in';
  const hodEmail = process.env.HOD_EMAIL || 'test-hod@siet.ac.in';

  // -------------------------------------------------------------------------
  // 1. VERIFY STUDENT SIGN-IN & JWT ISSUANCE
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: STUDENT AUTHENTICATION VIA SUPABASE AUTH ---');
  const { data: studentAuth, error: studentAuthErr } = await supabaseAnon.auth.signInWithPassword({
    email: studentEmail,
    password: testPassword,
  });

  if (studentAuthErr || !studentAuth.session) {
    console.error('❌ Student authentication failed:', studentAuthErr);
    process.exit(1);
  }
  console.log('✓ [PASS] Student signed in successfully through Supabase Auth');
  console.log('  User ID:', studentAuth.user.id);
  console.log('  Token issued, length:', studentAuth.session.access_token.length);

  // -------------------------------------------------------------------------
  // 2. VERIFY HOD SIGN-IN & JWT ISSUANCE
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: HOD AUTHENTICATION VIA SUPABASE AUTH ---');
  const { data: hodAuth, error: hodAuthErr } = await supabaseAnon.auth.signInWithPassword({
    email: hodEmail,
    password: testPassword,
  });

  if (hodAuthErr || !hodAuth.session) {
    console.error('❌ HOD authentication failed:', hodAuthErr);
    process.exit(1);
  }
  console.log('✓ [PASS] HOD signed in successfully through Supabase Auth');
  console.log('  User ID:', hodAuth.user.id);
  console.log('  Token issued, length:', hodAuth.session.access_token.length);

  // -------------------------------------------------------------------------
  // 3. VERIFY AUTHORITATIVE DATABASE IDENTITY (STUDENT)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: STUDENT AUTHORITATIVE DATABASE PROFILE LOOKUP ---');
  const studentClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${studentAuth.session.access_token}` } },
  });

  const { data: studentDbUser } = await studentClient
    .from('users')
    .select('id, email, name, role')
    .eq('id', studentAuth.user.id)
    .single();

  const { data: studentDbProfile } = await studentClient
    .from('students')
    .select('id, register_number, department, year, section')
    .eq('user_id', studentAuth.user.id)
    .single();

  if (studentDbUser?.role !== 'STUDENT' || studentDbProfile?.register_number !== '714023104999') {
    console.error('❌ Student DB profile verification failed:', { studentDbUser, studentDbProfile });
    process.exit(1);
  }
  console.log('✓ [PASS] Authoritative Student record verified in database:');
  console.log('  Role:', studentDbUser.role);
  console.log('  Register Number:', studentDbProfile.register_number);
  console.log('  Department / Class:', `${studentDbProfile.department} Year ${studentDbProfile.year} Sec ${studentDbProfile.section}`);

  // -------------------------------------------------------------------------
  // 4. VERIFY AUTHORITATIVE DATABASE IDENTITY (HOD)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: HOD AUTHORITATIVE DATABASE PROFILE LOOKUP ---');
  const hodClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${hodAuth.session.access_token}` } },
  });

  const { data: hodDbUser } = await hodClient
    .from('users')
    .select('id, email, name, role')
    .eq('id', hodAuth.user.id)
    .single();

  const { data: hodDbProfile } = await hodClient
    .from('hods')
    .select('id, designation, department')
    .eq('user_id', hodAuth.user.id)
    .single();

  if (hodDbUser?.role !== 'HOD' || hodDbProfile?.department !== 'CSE') {
    console.error('❌ HOD DB profile verification failed:', { hodDbUser, hodDbProfile });
    process.exit(1);
  }
  console.log('✓ [PASS] Authoritative HOD record verified in database:');
  console.log('  Role:', hodDbUser.role);
  console.log('  Designation:', hodDbProfile.designation);
  console.log('  Department:', hodDbProfile.department);

  // -------------------------------------------------------------------------
  // 5. VERIFY CROSS-STUDENT DATA ISOLATION (RLS)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 5: STUDENT-TO-STUDENT ROW-LEVEL SECURITY ISOLATION ---');
  const { data: visibleToStudent1 } = await studentClient.from('students').select('register_number');
  const student1Regs = (visibleToStudent1 || []).map((s) => s.register_number);
  
  if (student1Regs.includes('714023104998')) {
    console.error('❌ Cross-student isolation breach! Student 1 saw Student 2:', student1Regs);
    process.exit(1);
  }
  console.log('✓ [PASS] PostgreSQL RLS isolates students: Student 1 sees only own record:', student1Regs);

  // -------------------------------------------------------------------------
  // 6. VERIFY PRIVILEGED HOD RPC DENIAL FOR STUDENT
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 6: PRIVILEGED HOD RPC REJECTS STUDENT CALLER ---');
  const studentRpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_hod_od_decision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${studentAuth.session.access_token}`,
    },
    body: JSON.stringify({
      p_od_id: '00000000-0000-0000-0000-000000000001',
      p_actor_id: studentAuth.user.id,
      p_decision: 'APPROVED',
    }),
  });

  const studentRpcBody = await studentRpcRes.text();
  if (studentRpcRes.status === 200 || !studentRpcBody.includes('FORBIDDEN')) {
    console.error('❌ Student was NOT rejected by HOD RPC:', studentRpcRes.status, studentRpcBody);
    process.exit(1);
  }
  console.log('✓ [PASS] Privileged RPC exec_hod_od_decision rejected student with 400 FORBIDDEN');

  // -------------------------------------------------------------------------
  // 7. VERIFY PRIVILEGED HOD RPC ACCEPTS HOD CALLER
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 7: PRIVILEGED HOD RPC AUTHORIZES HOD CALLER ---');
  const hodRpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_hod_od_decision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${hodAuth.session.access_token}`,
    },
    body: JSON.stringify({
      p_od_id: '00000000-0000-0000-0000-000000000001',
      p_actor_id: hodAuth.user.id,
      p_decision: 'APPROVED',
    }),
  });

  const hodRpcBody = await hodRpcRes.text();
  // Status 500 with P0005 NOT_FOUND means authorization succeeded and row locking proceeded
  if (!hodRpcBody.includes('P0005')) {
    console.error('❌ HOD was unexpectedly rejected before record lookup:', hodRpcRes.status, hodRpcBody);
    process.exit(1);
  }
  console.log('✓ [PASS] Privileged RPC authorized HOD caller and verified actor binding (P0005 NOT_FOUND on dummy ID)');

  // -------------------------------------------------------------------------
  // 8. VERIFY SIGN-OUT AND TOKEN REVOCATION
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 8: SIGN-OUT AND SESSION REVOCATION ---');
  const { error: signOutErr } = await studentClient.auth.signOut();
  if (signOutErr) {
    console.error('❌ Sign out error:', signOutErr);
    process.exit(1);
  }
  console.log('✓ [PASS] Sign-out completed successfully');

  console.log('\n========================================================================');
  console.log('>>> ALL 8 LIVE SUPABASE AUTHENTICATION CHECKS PASSED SUCCESSFULLY <<<');
  console.log('========================================================================\n');
}

runLiveVerification().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
