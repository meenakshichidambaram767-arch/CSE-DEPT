/**
 * Route Handlers Contract Test Suite
 * Boots route handlers with a mocked Supabase client and asserts:
 * 1. Status codes (200, 201, 400, 401, 403, 404)
 * 2. RFC 7807 problem details error format
 * 3. Role guards (Anonymous vs STUDENT vs HOD)
 * 4. Strict snake_case wire format matching src/types/contract.ts
 */

import { NextRequest } from 'next/server';

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
// CASING DETECTOR UTILITY
// ============================================================================
const CAMEL_CASE_REGEX = /^[a-z]+[A-Z0-9]/;

function findCamelCaseKeys(obj: unknown, path: string = ''): string[] {
  if (obj === null || obj === undefined) return [];
  if (typeof obj !== 'object') return [];

  const violations: string[] = [];
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      violations.push(...findCamelCaseKeys(item, `${path}[${index}]`));
    });
    return violations;
  }

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (CAMEL_CASE_REGEX.test(key)) {
      violations.push(currentPath);
    }
    if (value && typeof value === 'object') {
      violations.push(...findCamelCaseKeys(value, currentPath));
    }
  }
  return violations;
}

// ============================================================================
// MOCK SUPABASE CLIENT & AUTH CONTEXT
// ============================================================================

type UserRole = 'STUDENT' | 'HOD' | null;

let currentRole: UserRole = null;

const STUDENT_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'student@example.com',
};

const HOD_USER = {
  id: '00000000-0000-0000-0000-000000000002',
  email: 'hod@example.com',
};

function createMockChain(defaultData: any = null) {
  const chain: any = {
    _data: defaultData,
    select: () => chain,
    insert: (data: any) => {
      chain._data = Array.isArray(data) ? data : [data];
      return chain;
    },
    update: (data: any) => {
      chain._data = [data];
      return chain;
    },
    delete: () => chain,
    eq: () => chain,
    neq: () => chain,
    in: () => chain,
    is: () => chain,
    ilike: () => chain,
    gte: () => chain,
    lte: () => chain,
    order: () => chain,
    range: () => chain,
    contains: () => chain,
    single: async () => ({
      data: Array.isArray(chain._data) ? chain._data[0] || null : chain._data,
      error: null,
    }),
    maybeSingle: async () => ({
      data: Array.isArray(chain._data) ? chain._data[0] || null : chain._data,
      error: null,
    }),
    then: (resolve: any) => {
      resolve({
        data: Array.isArray(chain._data) ? chain._data : (chain._data ? [chain._data] : []),
        error: null,
        count: Array.isArray(chain._data) ? chain._data.length : 1,
      });
    },
  };
  return chain;
}

function getMockSupabase() {
  const authUser = currentRole === 'STUDENT' ? STUDENT_USER : currentRole === 'HOD' ? HOD_USER : null;

  return {
    auth: {
      getUser: async () => ({
        data: { user: authUser },
        error: authUser ? null : new Error('Not authenticated'),
      }),
    },
    from: (table: string) => {
      if (table === 'users') {
        if (currentRole === 'STUDENT') {
          return createMockChain({
            id: STUDENT_USER.id,
            email: STUDENT_USER.email,
            role: 'STUDENT',
            name: 'Demo Student',
          });
        } else if (currentRole === 'HOD') {
          return createMockChain({
            id: HOD_USER.id,
            email: HOD_USER.email,
            role: 'HOD',
            name: 'Demo HOD',
          });
        }
        return createMockChain(null);
      }

      if (table === 'students') {
        return createMockChain({
          id: STUDENT_USER.id,
          user_id: STUDENT_USER.id,
          register_number: '21CS001',
          department: 'CSE',
          year: 'IV',
          section: 'A',
          created_at: new Date().toISOString(),
        });
      }

      if (table === 'hods') {
        return createMockChain({
          id: HOD_USER.id,
          user_id: HOD_USER.id,
          designation: 'Head of Department',
          department: 'CSE',
        });
      }

      if (table === 'od_requests') {
        return createMockChain({
          id: '11111111-1111-1111-1111-111111111111',
          student_id: STUDENT_USER.id,
          code: 'OD-2026-001',
          status: 'PENDING',
          category: 'EXTERNAL_EVENTS',
          event_title: 'Hackathon 2026',
          start_date: '2026-11-01',
          end_date: '2026-11-02',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      if (table === 'activities') {
        return createMockChain({
          id: '22222222-2222-2222-2222-222222222222',
          student_id: STUDENT_USER.id,
          code: 'PRJ-2026-001',
          category: 'PROJECT',
          title: 'Smart Campus System',
          status: 'SUBMITTED',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      if (table === 'review_sessions') {
        return createMockChain({
          id: '33333333-3333-3333-3333-333333333333',
          project_id: '22222222-2222-2222-2222-222222222222',
          title: 'Review 1: Architecture',
          scheduled_at: '2026-11-05T10:00:00Z',
          status: 'SCHEDULED',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      if (table === 'events') {
        return createMockChain({
          id: '44444444-4444-4444-4444-444444444444',
          title: 'Technical Symposium',
          event_type: 'SYMPOSIUM',
          date: '2026-11-10',
          created_at: new Date().toISOString(),
        });
      }

      if (table === 'notifications') {
        return createMockChain({
          id: '55555555-5555-5555-5555-555555555555',
          recipient_id: STUDENT_USER.id,
          title: 'OD Approved',
          message: 'Your OD request was approved',
          read: false,
          created_at: new Date().toISOString(),
        });
      }

      if (table === 'documents') {
        return createMockChain({
          id: '66666666-6666-6666-6666-666666666666',
          file_name: 'proof.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
          file_path: 'uploads/proof.pdf',
          storage_path: 'uploads/proof.pdf',
          owner_id: STUDENT_USER.id,
          uploaded_by: STUDENT_USER.id,
          created_at: new Date().toISOString(),
        });
      }

      return createMockChain([]);
    },
    rpc: async (functionName: string, args: any) => {
      if (functionName === 'exec_hod_od_decision' || functionName === 'exec_hod_activity_decision') {
        return { data: { success: true }, error: null };
      }
      if (functionName === 'generate_safe_od_code') {
        return { data: 'OD-2026-999', error: null };
      }
      if (functionName === 'generate_safe_activity_code') {
        return { data: 'PRJ-2026-999', error: null };
      }
      return { data: { success: true }, error: null };
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: 'uploads/test.pdf' }, error: null }),
        createSignedUrl: async () => ({
          data: { signedUrl: 'https://example.com/signed/test.pdf' },
          error: null,
        }),
      }),
    },
  };
}

(globalThis as any).__MOCK_SUPABASE_CLIENT__ = () => getMockSupabase();
(globalThis as any).__MOCK_SUPABASE_SERVICE_CLIENT__ = () => getMockSupabase();

// ============================================================================
// TEST SUITE EXECUTION
// ============================================================================

async function runContractTests() {
  console.log('========================================================================');
  console.log('ROUTE HANDLER CONTRACT & ROLE GUARD TEST SUITE');
  console.log('========================================================================\n');

  // --- 1. /api/v1/me ---
  console.log('--- ROUTE: /api/v1/me ---');
  const meRoute = await import('../src/app/api/v1/me/route');
  
  // Anonymous -> 401
  currentRole = null;
  let res = await meRoute.GET(new NextRequest('http://localhost/api/v1/me'));
  assert(res.status === 401, 'Anonymous request to /api/v1/me returns 401');
  let body = await res.json();
  assert(body.error?.code === 'UNAUTHORIZED', '401 response adheres to RFC 7807 error format');

  // Student -> 200 & snake_case
  currentRole = 'STUDENT';
  res = await meRoute.GET(new NextRequest('http://localhost/api/v1/me'));
  assert(res.status === 200, 'Student request to /api/v1/me returns 200');
  body = await res.json();
  assert(body.data?.role === 'STUDENT', 'Student profile data returned');
  let casingViolations = findCamelCaseKeys(body);
  assert(casingViolations.length === 0, 'Response has zero camelCase keys');

  // HOD -> 200 & snake_case
  currentRole = 'HOD';
  res = await meRoute.GET(new NextRequest('http://localhost/api/v1/me'));
  assert(res.status === 200, 'HOD request to /api/v1/me returns 200');
  body = await res.json();
  assert(body.data?.role === 'HOD', 'HOD profile data returned');
  casingViolations = findCamelCaseKeys(body);
  assert(casingViolations.length === 0, 'HOD response has zero camelCase keys');

  // --- 2. /api/v1/od-requests/bulk-decision (HOD only) ---
  console.log('\n--- ROUTE: /api/v1/od-requests/bulk-decision ---');
  const bulkRoute = await import('../src/app/api/v1/od-requests/bulk-decision/route');

  // Anonymous -> 401
  currentRole = null;
  res = await bulkRoute.POST(new NextRequest('http://localhost/api/v1/od-requests/bulk-decision', {
    method: 'POST',
    body: JSON.stringify({ request_ids: ['11111111-1111-1111-1111-111111111111'], decision: 'APPROVED' }),
  }));
  assert(res.status === 401, 'Anonymous request to bulk-decision returns 401');

  // Student -> 403 (RFC 7807)
  currentRole = 'STUDENT';
  res = await bulkRoute.POST(new NextRequest('http://localhost/api/v1/od-requests/bulk-decision', {
    method: 'POST',
    body: JSON.stringify({ request_ids: ['11111111-1111-1111-1111-111111111111'], decision: 'APPROVED' }),
  }));
  assert(res.status === 403, 'Student request to bulk-decision returns 403');
  body = await res.json();
  assert(body.error?.code === 'FORBIDDEN', 'Student rejection is RFC 7807 FORBIDDEN');

  // HOD -> 200 & snake_case
  currentRole = 'HOD';
  res = await bulkRoute.POST(new NextRequest('http://localhost/api/v1/od-requests/bulk-decision', {
    method: 'POST',
    body: JSON.stringify({ request_ids: ['11111111-1111-1111-1111-111111111111'], decision: 'APPROVED' }),
  }));
  assert(res.status === 200, 'HOD request to bulk-decision returns 200');
  body = await res.json();
  assert(body.data?.updated_count !== undefined, 'Bulk decision returns updated_count');
  casingViolations = findCamelCaseKeys(body);
  assert(casingViolations.length === 0, 'Bulk decision response has zero camelCase keys');

  // --- 3. /api/v1/notifications/mark-all-read ---
  console.log('\n--- ROUTE: /api/v1/notifications/mark-all-read ---');
  const markAllReadRoute = await import('../src/app/api/v1/notifications/mark-all-read/route');
  
  // Anonymous -> 401
  currentRole = null;
  res = await markAllReadRoute.POST(new NextRequest('http://localhost/api/v1/notifications/mark-all-read', { method: 'POST' }));
  assert(res.status === 401, 'Anonymous request to mark-all-read returns 401');

  // Student -> 200 & snake_case
  currentRole = 'STUDENT';
  res = await markAllReadRoute.POST(new NextRequest('http://localhost/api/v1/notifications/mark-all-read', { method: 'POST' }));
  assert(res.status === 200, 'Student request to mark-all-read returns 200');
  body = await res.json();
  assert(body.data?.success === true, 'mark-all-read returns success: true');
  casingViolations = findCamelCaseKeys(body);
  assert(casingViolations.length === 0, 'mark-all-read has zero camelCase keys');

  // --- 4. Review endpoints: attendance, notes, cancel ---
  console.log('\n--- ROUTE: /api/v1/reviews/sessions/[id]/attendance ---');
  const attendanceRoute = await import('../src/app/api/v1/reviews/sessions/[id]/attendance/route');

  // Student -> 403
  currentRole = 'STUDENT';
  res = await attendanceRoute.PUT(new NextRequest('http://localhost/api/v1/reviews/sessions/33333333-3333-3333-3333-333333333333/attendance', {
    method: 'PUT',
    body: JSON.stringify({ attendance: ['present'] }),
  }), { params: Promise.resolve({ id: '33333333-3333-3333-3333-333333333333' }) });
  assert(res.status === 403, 'Student updating review attendance returns 403 FORBIDDEN');

  // HOD -> 200
  currentRole = 'HOD';
  res = await attendanceRoute.PUT(new NextRequest('http://localhost/api/v1/reviews/sessions/33333333-3333-3333-3333-333333333333/attendance', {
    method: 'PUT',
    body: JSON.stringify({ attendance: ['present'] }),
  }), { params: Promise.resolve({ id: '33333333-3333-3333-3333-333333333333' }) });
  assert(res.status === 200, 'HOD updating review attendance returns 200');
  body = await res.json();
  casingViolations = findCamelCaseKeys(body);
  assert(casingViolations.length === 0, 'Attendance response has zero camelCase keys');

  console.log('\n--- ROUTE: /api/v1/reviews/sessions/[id]/notes ---');
  const notesRoute = await import('../src/app/api/v1/reviews/sessions/[id]/notes/route');
  currentRole = 'HOD';
  res = await notesRoute.PUT(new NextRequest('http://localhost/api/v1/reviews/sessions/33333333-3333-3333-3333-333333333333/notes', {
    method: 'PUT',
    body: JSON.stringify({ notes: 'Progress looks good' }),
  }), { params: Promise.resolve({ id: '33333333-3333-3333-3333-333333333333' }) });
  assert(res.status === 200, 'HOD updating review notes returns 200');

  console.log('\n--- ROUTE: /api/v1/reviews/sessions/[id]/cancel ---');
  const cancelRoute = await import('../src/app/api/v1/reviews/sessions/[id]/cancel/route');
  currentRole = 'HOD';
  res = await cancelRoute.POST(new NextRequest('http://localhost/api/v1/reviews/sessions/33333333-3333-3333-3333-333333333333/cancel', {
    method: 'POST',
    body: JSON.stringify({ reason: 'Rescheduled' }),
  }), { params: Promise.resolve({ id: '33333333-3333-3333-3333-333333333333' }) });
  assert(res.status === 200, 'HOD cancelling review returns 200');

  // --- 5. /api/v1/records/students & export (HOD only) ---
  console.log('\n--- ROUTE: /api/v1/records/students ---');
  const recordsRoute = await import('../src/app/api/v1/records/students/route');

  // Student -> 403
  currentRole = 'STUDENT';
  res = await recordsRoute.GET(new NextRequest('http://localhost/api/v1/records/students'));
  assert(res.status === 403, 'Student accessing records returns 403 FORBIDDEN');

  // HOD -> 200
  currentRole = 'HOD';
  res = await recordsRoute.GET(new NextRequest('http://localhost/api/v1/records/students'));
  assert(res.status === 200, 'HOD accessing records returns 200');
  body = await res.json();
  casingViolations = findCamelCaseKeys(body);
  assert(casingViolations.length === 0, 'Records response has zero camelCase keys');

  // --- 6. /api/v1/reports/summary (HOD only) ---
  console.log('\n--- ROUTE: /api/v1/reports/summary ---');
  const summaryRoute = await import('../src/app/api/v1/reports/summary/route');
  
  // Student -> 403
  currentRole = 'STUDENT';
  res = await summaryRoute.GET(new NextRequest('http://localhost/api/v1/reports/summary'));
  assert(res.status === 403, 'Student accessing reports summary returns 403 FORBIDDEN');

  // HOD -> 200
  currentRole = 'HOD';
  res = await summaryRoute.GET(new NextRequest('http://localhost/api/v1/reports/summary'));
  assert(res.status === 200, 'HOD accessing reports summary returns 200');
  body = await res.json();
  casingViolations = findCamelCaseKeys(body);
  assert(casingViolations.length === 0, 'Reports summary has zero camelCase keys');

  // --- 7. /api/v1/documents/upload ---
  console.log('\n--- ROUTE: /api/v1/documents/upload ---');
  const uploadRoute = await import('../src/app/api/v1/documents/upload/route');
  
  // Anonymous -> 401
  currentRole = null;
  res = await uploadRoute.POST(new NextRequest('http://localhost/api/v1/documents/upload', { method: 'POST' }));
  assert(res.status === 401, 'Anonymous upload returns 401');

  // --- 8. /api/v1/documents/[id]/url ---
  console.log('\n--- ROUTE: /api/v1/documents/[id]/url ---');
  const docUrlRoute = await import('../src/app/api/v1/documents/[id]/url/route');
  
  currentRole = 'STUDENT';
  res = await docUrlRoute.GET(new NextRequest('http://localhost/api/v1/documents/66666666-6666-6666-6666-666666666666/url'), {
    params: Promise.resolve({ id: '66666666-6666-6666-6666-666666666666' }),
  });
  assert(res.status === 200, 'Signed document URL request returns 200');
  body = await res.json();
  assert(body.data?.signed_url !== undefined, 'Returns signed_url in snake_case format');
  casingViolations = findCamelCaseKeys(body);
  assert(casingViolations.length === 0, 'Document URL response has zero camelCase keys');

  // --- 9. /api/v1/od-requests/[id]/resubmit (Student only) ---
  console.log('\n--- ROUTE: /api/v1/od-requests/[id]/resubmit ---');
  const resubmitRoute = await import('../src/app/api/v1/od-requests/[id]/resubmit/route');
  
  // HOD -> 403
  currentRole = 'HOD';
  res = await resubmitRoute.PUT(new NextRequest('http://localhost/api/v1/od-requests/11111111-1111-1111-1111-111111111111/resubmit', {
    method: 'PUT',
    body: JSON.stringify({ reason: 'Updated details' }),
  }), { params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }) });
  assert(res.status === 403, 'HOD cannot call student resubmit endpoint (returns 403)');

  // --- 10. /api/v1/students ---
  console.log('\n--- ROUTE: /api/v1/students ---');
  const studentsRoute = await import('../src/app/api/v1/students/route');
  currentRole = 'STUDENT';
  res = await studentsRoute.GET(new NextRequest('http://localhost/api/v1/students'));
  assert(res.status === 200, 'Students directory returns 200');
  body = await res.json();
  casingViolations = findCamelCaseKeys(body);
  assert(casingViolations.length === 0, 'Students directory has zero camelCase keys');

  // Summary
  console.log('\n------------------------------------------------------------------------');
  console.log(`TOTAL CONTRACT TESTS: ${totalTests}`);
  console.log(`PASSED:               ${passedTests}`);
  console.log(`FAILED:               ${failedTests}`);
  console.log('------------------------------------------------------------------------\n');

  if (failedTests > 0) {
    console.error(`>>> ROUTE CONTRACT TESTS FAILED: ${failedTests} test(s) failed! <<<`);
    process.exit(1);
  } else {
    console.log('>>> ROUTE CONTRACT TESTS PASSED: All route contracts, role guards & snake_case formats verified! <<<\n');
  }
}

runContractTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
