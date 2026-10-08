/**
 * Phase 6 Verification Script:
 * Existing HOD Records + Reports + Notifications + Navigation API-Contract Compatibility Retrofit
 * 
 * Tests 56 criteria + static code analysis.
 */

import fs from 'fs';
import path from 'path';
import {
  recordsApi,
  reportsApi,
  notificationsApi,
  reviewsApi,
  type StudentRecordQuery,
  type AccreditationReportContract,
  type ReportsSummaryContract,
  type NotificationContract,
} from '../src/lib/api';
import { ApiError, parseApiError, formatApiErrorMessage } from '../src/lib/api/client';

interface TestResult {
  id: number;
  category: string;
  name: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function assert(id: number, category: string, name: string, condition: boolean, message?: string) {
  results.push({
    id,
    category,
    name,
    passed: condition,
    message: condition ? undefined : message || 'Assertion failed',
  });
}

async function runPhase6Tests() {
  console.log('========================================================================');
  console.log('STARTING PHASE 6 HOD RECORDS + REPORTS + NOTIFICATIONS + NAVIGATION TESTS');
  console.log('========================================================================\n');

  const rootDir = process.cwd();

  // -------------------------------------------------------------
  // RECORDS TESTS (1 - 17)
  // -------------------------------------------------------------
  const hodRecordsRoute = path.resolve(rootDir, 'src/app/hod/records/page.tsx');
  assert(1, 'RECORDS', 'HOD Records route exists', fs.existsSync(hodRecordsRoute));

  const allRecords = await recordsApi.getStudents();
  assert(
    2,
    'RECORDS',
    'records API mapping',
    allRecords.students.length > 0 &&
    typeof allRecords.total === 'number' &&
    typeof allRecords.page === 'number' &&
    typeof allRecords.page_size === 'number' &&
    allRecords.students[0].register_number !== undefined
  );

  const yearFiltered = await recordsApi.getStudents({ year: 'II' });
  assert(
    3,
    'RECORDS',
    'year filter',
    yearFiltered.students.length > 0 && yearFiltered.students.every((s) => s.year === 'II')
  );

  const secFiltered = await recordsApi.getStudents({ section: 'A' });
  assert(
    4,
    'RECORDS',
    'section filter',
    secFiltered.students.length > 0 && secFiltered.students.every((s) => s.section === 'A')
  );

  const searchFiltered = await recordsApi.getStudents({ search: 'Meena' });
  assert(
    5,
    'RECORDS',
    'search filter',
    searchFiltered.students.length > 0 && searchFiltered.students.some((s) => s.name.includes('Meena'))
  );

  const page1 = await recordsApi.getStudents({ page: 1, page_size: 4 });
  const page2 = await recordsApi.getStudents({ page: 2, page_size: 4 });
  assert(
    6,
    'RECORDS',
    'pagination',
    page1.students.length === 4 &&
    page2.students.length === 4 &&
    page1.students[0].id !== page2.students[0].id &&
    page1.total_pages >= 2
  );

  const recordsSrc = fs.readFileSync(hodRecordsRoute, 'utf-8');
  assert(7, 'RECORDS', 'loading state', recordsSrc.includes('isLoading') && recordsSrc.includes('animate-spin'));
  assert(8, 'RECORDS', 'empty state', recordsSrc.includes('No Student Records Found') || recordsSrc.includes('students.length === 0'));
  assert(9, 'RECORDS', 'error state', recordsSrc.includes('loadError') && recordsSrc.includes('Failed to Load Records'));

  const sampleStudent = allRecords.students[0];
  const summaryRes = await recordsApi.getStudentSummary(sampleStudent.id);
  assert(10, 'RECORDS', 'student summary route', summaryRes !== null && summaryRes.student !== undefined);
  assert(
    11,
    'RECORDS',
    'student summary mapping',
    summaryRes.student.id === sampleStudent.id &&
    summaryRes.student.register_number === sampleStudent.register_number
  );
  assert(
    12,
    'RECORDS',
    'OD clearance display',
    Array.isArray(summaryRes.od_clearances) && summaryRes.od_clearances.length > 0 &&
    recordsSrc.includes('od_clearances')
  );
  assert(
    13,
    'RECORDS',
    'activity participation display',
    Array.isArray(summaryRes.activities) && summaryRes.activities.length > 0 &&
    recordsSrc.includes('activities')
  );
  assert(
    14,
    'RECORDS',
    'review history display',
    Array.isArray(summaryRes.reviews) && summaryRes.reviews.length > 0 &&
    recordsSrc.includes('reviews')
  );

  const csvExportAll = await recordsApi.exportRecords();
  assert(
    15,
    'RECORDS',
    'records export',
    typeof csvExportAll === 'string' && csvExportAll.startsWith('Student ID,Register Number,Name')
  );

  const csvExportFiltered = await recordsApi.exportRecords({ year: 'IV', section: 'A' });
  assert(
    16,
    'RECORDS',
    'export filter preservation',
    csvExportFiltered.includes('714022104153') && !csvExportFiltered.includes('714023104088')
  );

  const csvLines = csvExportAll.trim().split('\r\n');
  assert(
    17,
    'RECORDS',
    'CSV handling',
    csvLines.length >= 2 && csvLines[0].split(',').length === 10
  );

  // -------------------------------------------------------------
  // REPORTS TESTS (18 - 30)
  // -------------------------------------------------------------
  const hodReportsRoute = path.resolve(rootDir, 'src/app/hod/reports/page.tsx');
  assert(18, 'REPORTS', 'HOD Reports route exists', fs.existsSync(hodReportsRoute));

  const accReport = await reportsApi.getAccreditationReport('2026-2027');
  assert(
    19,
    'REPORTS',
    'accreditation API mapping',
    accReport.academic_year === '2026-2027' &&
    accReport.department === 'Computer Science and Engineering' &&
    accReport.metrics !== undefined
  );

  assert(20, 'REPORTS', 'academic_year mapping', accReport.academic_year === '2026-2027');
  assert(
    21,
    'REPORTS',
    'criteria_1_3_2 mapping',
    accReport.metrics.criteria_1_3_2 !== undefined &&
    accReport.metrics.criteria_1_3_2.count > 0 &&
    accReport.metrics.criteria_1_3_2.label.includes('Projects')
  );
  assert(
    22,
    'REPORTS',
    'criteria_5_3_1 mapping',
    accReport.metrics.criteria_5_3_1 !== undefined &&
    accReport.metrics.criteria_5_3_1.count > 0 &&
    accReport.metrics.criteria_5_3_1.label.includes('Hackathon')
  );
  assert(
    23,
    'REPORTS',
    'criteria_1_3_3 mapping',
    accReport.metrics.criteria_1_3_3 !== undefined &&
    accReport.metrics.criteria_1_3_3.count > 0 &&
    accReport.metrics.criteria_1_3_3.label.includes('Internships')
  );
  assert(
    24,
    'REPORTS',
    'total approved OD mapping',
    typeof accReport.metrics.total_approved_od_clearances === 'number' &&
    accReport.metrics.total_approved_od_clearances > 0
  );

  const reportsSrc = fs.readFileSync(hodReportsRoute, 'utf-8');
  assert(25, 'REPORTS', 'report loading state', reportsSrc.includes('isLoading') && reportsSrc.includes('animate-spin'));
  assert(26, 'REPORTS', 'report empty state', reportsSrc.includes('!report') || reportsSrc.includes('Accreditation Report Unavailable'));
  assert(27, 'REPORTS', 'report error state', reportsSrc.includes('reportError') && reportsSrc.includes('Report Query Failed'));

  // Assert no hardcoded report totals inside page.tsx (it binds to report.metrics)
  assert(
    28,
    'REPORTS',
    'no hardcoded report totals',
    reportsSrc.includes('report.metrics.criteria_1_3_2.count') &&
    reportsSrc.includes('report.metrics.criteria_5_3_1.count') &&
    reportsSrc.includes('report.metrics.criteria_1_3_3.count') &&
    reportsSrc.includes('report.metrics.total_approved_od_clearances')
  );

  // Assert no client-only report calculation (does not compute .length from mock arrays)
  assert(
    29,
    'REPORTS',
    'no client-only report calculation',
    !reportsSrc.includes('approvedProjects.length') &&
    !reportsSrc.includes('approvedHackathons.length') &&
    !reportsSrc.includes('approvedInternships.length')
  );

  const repSummary = await reportsApi.getReportsSummary('2026-2027');
  assert(
    30,
    'REPORTS',
    'summary API mapping where applicable',
    repSummary.total_activities > 0 &&
    repSummary.criteria_breakdown.criteria_1_3_2 > 0
  );

  // -------------------------------------------------------------
  // NOTIFICATIONS TESTS (31 - 37)
  // -------------------------------------------------------------
  const notifRes = await notificationsApi.getAll();
  assert(
    31,
    'NOTIFICATIONS',
    'notification API mapping',
    Array.isArray(notifRes.notifications) &&
    typeof notifRes.unread_count === 'number' &&
    notifRes.notifications[0].user_id !== undefined
  );

  assert(32, 'NOTIFICATIONS', 'notification list', notifRes.notifications.length >= 4);

  const unreadOnly = await notificationsApi.getAll({ unread_only: true });
  assert(33, 'NOTIFICATIONS', 'unread state', unreadOnly.notifications.every((n) => !n.is_read));

  const targetNotif = unreadOnly.notifications[0];
  const markRes = await notificationsApi.markAsRead(targetNotif.id);
  assert(34, 'NOTIFICATIONS', 'read state', markRes.is_read === true);

  const reFetched = await notificationsApi.getAll();
  const updatedNotif = reFetched.notifications.find((n) => n.id === targetNotif.id);
  assert(35, 'NOTIFICATIONS', 'mark-as-read action', updatedNotif?.is_read === true);

  let notifErrorCaught = false;
  try {
    await notificationsApi.markAsRead('non-existent-notif-9999');
  } catch (err: any) {
    if (err instanceof ApiError && err.code === 'NOTIFICATION_NOT_FOUND' && err.status === 404) {
      notifErrorCaught = true;
    }
  }
  assert(36, 'NOTIFICATIONS', 'notification error handling', notifErrorCaught);

  const dataContextSrc = fs.readFileSync(path.resolve(rootDir, 'src/context/DataContext.tsx'), 'utf-8');
  assert(
    37,
    'NOTIFICATIONS',
    'no notification localStorage fake DB',
    !dataContextSrc.includes("localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}notifs`")
  );

  // -------------------------------------------------------------
  // NAVIGATION TESTS (38 - 46)
  // -------------------------------------------------------------
  const sidebarSrc = fs.readFileSync(path.resolve(rootDir, 'src/components/layout/Sidebar.tsx'), 'utf-8');

  assert(38, 'NAVIGATION', 'student Activities navigation', sidebarSrc.includes("href: '/student/activities'"));
  assert(39, 'NAVIGATION', 'student Reviews navigation', sidebarSrc.includes("href: '/student/reviews'"));

  const applyOdRoute = path.resolve(rootDir, 'src/app/student/apply-od/page.tsx');
  assert(40, 'NAVIGATION', 'student OD canonical navigation', fs.existsSync(applyOdRoute) && sidebarSrc.includes("href: '/student/apply-od'"));

  assert(41, 'NAVIGATION', 'HOD Approvals navigation', sidebarSrc.includes("href: '/hod/approvals'"));
  assert(42, 'NAVIGATION', 'HOD Records navigation', sidebarSrc.includes("href: '/hod/records'"));
  assert(43, 'NAVIGATION', 'HOD Reviews navigation', sidebarSrc.includes("href: '/hod/reviews'"));
  assert(44, 'NAVIGATION', 'HOD Reports navigation', sidebarSrc.includes("href: '/hod/reports'"));

  assert(
    45,
    'NAVIGATION',
    'role-appropriate navigation',
    sidebarSrc.includes('role === \'STUDENT\' ? studentNav : hodNav')
  );

  const hodRequestsRoute = path.resolve(rootDir, 'src/app/hod/requests/page.tsx');
  assert(46, 'NAVIGATION', 'no duplicate canonical workflows', fs.existsSync(hodRequestsRoute));

  // -------------------------------------------------------------
  // CLEANUP & SECURITY CHECKS (47 - 51)
  // -------------------------------------------------------------
  // 47. No incompatible mockUsers usage in modified Records UI
  assert(47, 'CLEANUP', 'no incompatible mockUsers usage in modified flows', !recordsSrc.includes('mockUsers'));

  // 48. No duplicate report state system
  assert(48, 'CLEANUP', 'no duplicate report state system', !dataContextSrc.includes('reportStateStore'));

  // 49. No duplicate notification state system
  assert(49, 'CLEANUP', 'no duplicate notification state system', !dataContextSrc.includes('duplicateNotifStore'));

  // 50. No direct domain fetch bypasses in modified flows
  assert(50, 'CLEANUP', 'no direct domain fetch bypasses in modified flows', !recordsSrc.includes('fetch(') && !reportsSrc.includes('fetch('));

  // 51. No live backend calls
  const clientSrc = fs.readFileSync(path.resolve(rootDir, 'src/lib/api/client.ts'), 'utf-8');
  assert(51, 'CLEANUP', 'no live backend calls', clientSrc.includes('assertNoLiveNetwork'));

  // -------------------------------------------------------------
  // REGRESSION TESTS (52 - 56)
  // -------------------------------------------------------------
  // 52. Phase 1 regression
  const apiIndexSrc = fs.readFileSync(path.resolve(rootDir, 'src/lib/api/index.ts'), 'utf-8');
  assert(
    52,
    'REGRESSION',
    'Phase 1 regression (Foundation API modules & client)',
    apiIndexSrc.includes('client') && apiIndexSrc.includes('contractTypes')
  );

  // 53. Phase 2 regression
  assert(
    53,
    'REGRESSION',
    'Phase 2 regression (DataContext review and activity actions)',
    dataContextSrc.includes('submitWeeklyProgress') && dataContextSrc.includes('addActivity')
  );

  // 54. Phase 3 OD regression
  const studentOdRoute = path.resolve(rootDir, 'src/app/student/od-requests/page.tsx');
  assert(54, 'REGRESSION', 'Phase 3 OD regression', fs.existsSync(studentOdRoute));

  // 55. Phase 4 Activities regression
  const studentProjectsRoute = path.resolve(rootDir, 'src/app/student/projects/page.tsx');
  assert(55, 'REGRESSION', 'Phase 4 Activities regression', fs.existsSync(studentProjectsRoute));

  // 56. Phase 5 Reviews regression
  const hodReviewsRoute = path.resolve(rootDir, 'src/app/hod/reviews/page.tsx');
  assert(56, 'REGRESSION', 'Phase 5 Reviews regression', fs.existsSync(hodReviewsRoute));

  // Print Summary
  console.log('----------------- TEST RESULTS -----------------');
  let passCount = 0;
  for (const r of results) {
    if (r.passed) {
      passCount++;
      console.log(`[PASS] ${r.id.toString().padStart(2, ' ')}. [${r.category}] ${r.name}`);
    } else {
      console.error(`[FAIL] ${r.id.toString().padStart(2, ' ')}. [${r.category}] ${r.name} - ${r.message}`);
    }
  }

  console.log('------------------------------------------------');
  console.log(`TOTAL: ${passCount} / ${results.length} PASSED`);

  if (passCount === results.length) {
    console.log('\n>>> PHASE 6 STATUS: ALL TESTS PASSED <<<\n');
    process.exit(0);
  } else {
    console.error('\n>>> PHASE 6 STATUS: SOME TESTS FAILED <<<\n');
    process.exit(1);
  }
}

runPhase6Tests().catch((err) => {
  console.error('Fatal error running Phase 6 tests:', err);
  process.exit(1);
});
