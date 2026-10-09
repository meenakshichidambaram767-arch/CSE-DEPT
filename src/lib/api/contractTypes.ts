/**
 * API Contract v2.0 - Core Contract Types & Mappers
 * Reviews, Activities, OD, and Attendance Modules
 * Strictly non-evaluative, RFC7807 compliant
 */

export type ReviewType =
  | 'PROJECT_WEEKLY'
  | 'HACKATHON_POST'
  | 'INTERNSHIP_MID'
  | 'INTERNSHIP_FINAL';

export type ReviewTypeContract = ReviewType;

export type ReviewSessionStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export type ReviewSessionStatusContract = ReviewSessionStatus;



// -------------------------------------------------------------
// Review Progress Contract (Snake Case at API Boundary)
// -------------------------------------------------------------
export interface ReviewProgressContract {
  completed_this_week: string;
  currently_working_on: string;
  next_week_goal: string;
  blockers: string;
  github_url?: string;
  student_id?: string;
  student_name?: string;
  submitted_at?: string;
}

// -------------------------------------------------------------
// Review Attendance Contract
// -------------------------------------------------------------
export interface AttendanceContractItem {
  student_id: string;
  name: string;
  reg_no: string;
  attended: boolean;
  check_in_time?: string;
}

// -------------------------------------------------------------
// Review Scheduling Contract
// -------------------------------------------------------------
export interface ScheduleReviewContractPayload {
  activity_id: string;
  activity_title?: string;
  review_type: ReviewType;
  scheduled_date: string; // YYYY-MM-DD
  time: string;
  venue: string;
  faculty_reviewer?: string;
  total_reviews?: number;
  interval_weeks?: number;
}

// -------------------------------------------------------------
// QR Generation & Check-In Contract
// -------------------------------------------------------------
export interface GenerateQRResponse {
  token: string;
  expires_at: string;
  valid_seconds: number;
  session_id: string;
  generated_at: string;
}

export interface CheckInQRRequest {
  token: string;
  student_id: string;
  student_name?: string;
  student_reg_no?: string;
}

export interface CheckInQRResponse {
  success: boolean;
  session_id: string;
  student_id: string;
  checked_in_at: string;
  message: string;
}

// -------------------------------------------------------------
// Finalize Review Contract
// -------------------------------------------------------------
export interface FinalizeReviewRequest {
  meeting_notes?: string;
  next_week_goal?: string;
}

export interface FinalizeReviewResponse {
  session_id: string;
  status: 'COMPLETED';
  finalized_at: string;
  meeting_notes?: string;
  next_week_goal?: string;
}

// -------------------------------------------------------------
// Review Session API Boundary Schema
// -------------------------------------------------------------
export interface ReviewSessionContract {
  id: string;
  code?: string;
  activity_id: string;
  activity_title: string;
  activity_type: string;
  review_number: number;
  review_type: ReviewType;
  date: string;
  raw_date?: string;
  time: string;
  venue: string;
  faculty_reviewer?: string;
  status: ReviewSessionStatus;
  student_team: Array<{
    name: string;
    reg_no: string;
    email: string;
    role?: string;
  }>;
  progress?: ReviewProgressContract;
  attendance: AttendanceContractItem[];
  meeting_notes?: string;
  next_week_goal?: string;
  qr_code_token?: string;
  qr_expires_at?: string;
  qr_valid_seconds?: number;
  finalized_at?: string;
  created_at: string;
}

// -------------------------------------------------------------
// Mappers: UI (camelCase) <-> API Contract (snake_case)
// -------------------------------------------------------------
import { WeeklyProgress, ReviewSession, AttendanceItem, ActivityType } from '@/types';

export function mapProgressToContract(
  uiProgress: Partial<WeeklyProgress>
): ReviewProgressContract {
  return {
    completed_this_week: uiProgress.completedThisWeek || '',
    currently_working_on: uiProgress.currentlyWorkingOn || '',
    next_week_goal: uiProgress.nextWeekGoal || '',
    blockers: uiProgress.blockers || '',
    github_url: uiProgress.githubUrl || undefined,
    student_id: uiProgress.studentId,
    student_name: uiProgress.studentName,
    submitted_at: uiProgress.submittedAt,
  };
}

export function mapContractToProgress(
  contract: ReviewProgressContract,
  reviewSessionId: string = ''
): WeeklyProgress {
  return {
    id: `prog-${Date.now()}`,
    reviewSessionId,
    studentId: contract.student_id || 'usr-student-001',
    studentName: contract.student_name || 'Student',
    completedThisWeek: contract.completed_this_week,
    currentlyWorkingOn: contract.currently_working_on,
    nextWeekGoal: contract.next_week_goal,
    blockers: contract.blockers,
    githubUrl: contract.github_url,
    submittedAt: contract.submitted_at || new Date().toISOString(),
  };
}

export function mapContractToAttendance(
  items: AttendanceContractItem[]
): AttendanceItem[] {
  return items.map((item) => ({
    studentId: item.student_id,
    name: item.name,
    regNo: item.reg_no,
    attended: item.attended,
    checkInTime: item.check_in_time,
  }));
}

export function mapAttendanceToContract(
  items: AttendanceItem[]
): AttendanceContractItem[] {
  return items.map((item) => ({
    student_id: item.studentId,
    name: item.name,
    reg_no: item.regNo,
    attended: item.attended,
    check_in_time: item.checkInTime,
  }));
}

export function mapContractToReviewSession(
  c: ReviewSessionContract
): ReviewSession {
  return {
    id: c.id,
    activityId: c.activity_id,
    activityTitle: c.activity_title,
    activityType: c.activity_type as ActivityType,
    reviewNumber: c.review_number,
    reviewType: c.review_type,
    date: c.date,
    rawDate: c.raw_date,
    time: c.time,
    venue: c.venue,
    status: c.status,
    studentTeam: c.student_team.map((m) => ({
      name: m.name,
      regNo: m.reg_no,
      email: m.email,
      role: m.role,
    })),
    progress: c.progress ? mapContractToProgress(c.progress, c.id) : undefined,
    attendance: mapContractToAttendance(c.attendance),
    meetingNotes: c.meeting_notes,
    nextWeekGoal: c.next_week_goal,
    qrCodeToken: c.qr_code_token,
    qrExpiresAt: c.qr_expires_at,
    qrValidSeconds: c.qr_valid_seconds,
    finalizedAt: c.finalized_at,
    createdAt: c.created_at,
  };
}

export function mapReviewSessionToContract(
  s: ReviewSession
): ReviewSessionContract {
  return {
    id: s.id,
    activity_id: s.activityId,
    activity_title: s.activityTitle,
    activity_type: s.activityType,
    review_number: s.reviewNumber,
    review_type: (s.reviewType as ReviewType) || 'PROJECT_WEEKLY',
    date: s.date,
    raw_date: s.rawDate,
    time: s.time,
    venue: s.venue,
    status: s.status,
    student_team: s.studentTeam.map((m) => ({
      name: m.name,
      reg_no: m.regNo,
      email: m.email,
      role: m.role,
    })),
    progress: s.progress ? mapProgressToContract(s.progress) : undefined,
    attendance: mapAttendanceToContract(s.attendance),
    meeting_notes: s.meetingNotes,
    next_week_goal: s.nextWeekGoal,
    qr_code_token: s.qrCodeToken,
    qr_expires_at: s.qrExpiresAt,
    qr_valid_seconds: s.qrValidSeconds,
    finalized_at: s.finalizedAt,
    created_at: s.createdAt || new Date().toISOString(),
  };
}

// -------------------------------------------------------------
// Field Validation
// -------------------------------------------------------------
export function validateProgressContract(payload: ReviewProgressContract): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!payload.completed_this_week || payload.completed_this_week.trim().length === 0) {
    errors.completed_this_week = 'completed_this_week is required';
  } else if (payload.completed_this_week.trim().length < 5) {
    errors.completed_this_week = 'completed_this_week must be at least 5 characters';
  }

  if (!payload.currently_working_on || payload.currently_working_on.trim().length === 0) {
    errors.currently_working_on = 'currently_working_on is required';
  } else if (payload.currently_working_on.trim().length < 5) {
    errors.currently_working_on = 'currently_working_on must be at least 5 characters';
  }

  if (!payload.next_week_goal || payload.next_week_goal.trim().length === 0) {
    errors.next_week_goal = 'next_week_goal is required';
  } else if (payload.next_week_goal.trim().length < 5) {
    errors.next_week_goal = 'next_week_goal must be at least 5 characters';
  }

  if (payload.github_url && payload.github_url.trim().length > 0) {
    const trimmed = payload.github_url.trim();
    if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) {
      errors.github_url = 'github_url must be a valid HTTP or HTTPS URL';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// =============================================================
// PHASE 6 CONTRACT TYPES: RECORDS, REPORTS, NOTIFICATIONS
// =============================================================

// -------------------------------------------------------------
// HOD Student Records Contracts
// -------------------------------------------------------------
export type AcademicYearContract = 'I' | 'II' | 'III' | 'IV';
export type SectionContract = 'A' | 'B' | 'C' | 'D' | 'E';

export interface StudentRecordContract {
  id: string;
  name: string;
  register_number: string;
  email: string;
  department: string;
  year: AcademicYearContract;
  section: SectionContract;
  approved_od_count: number;
  activity_count: number;
  review_count: number;
}

export interface StudentRecordListResponse {
  students: StudentRecordContract[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface StudentRecordQuery {
  year?: AcademicYearContract;
  section?: SectionContract;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface StudentSummaryResponse {
  student: {
    id: string;
    name: string;
    register_number: string;
    email: string;
    department: string;
    year: AcademicYearContract;
    section: SectionContract;
  };
  od_clearances: Array<{
    id: string;
    event_name: string;
    date: string;
    status: string;
    approved_at?: string;
  }>;
  activities: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    role?: string;
  }>;
  reviews: Array<{
    id: string;
    review_type: ReviewType;
    date: string;
    status: ReviewSessionStatus;
    attended: boolean;
  }>;
}

// -------------------------------------------------------------
// HOD Reports / Accreditation Contracts
// -------------------------------------------------------------
export interface AccreditationMetricItem {
  label: string;
  count: number;
  active_capstones?: number;
  unique_students?: number;
  verified?: number;
}

export interface AccreditationReportContract {
  academic_year: string;
  department: string;
  metrics: {
    criteria_1_3_2: AccreditationMetricItem;
    criteria_5_3_1: AccreditationMetricItem;
    criteria_1_3_3: AccreditationMetricItem;
    total_approved_od_clearances: number;
  };
}

export interface ReportsSummaryContract {
  academic_year: string;
  department: string;
  total_activities: number;
  total_approved_ods: number;
  total_completed_reviews: number;
  criteria_breakdown: {
    criteria_1_3_2: number;
    criteria_5_3_1: number;
    criteria_1_3_3: number;
  };
}

// -------------------------------------------------------------
// Notifications Contracts
// -------------------------------------------------------------
export interface NotificationContract {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'REVIEW_REMINDER' | 'PROGRESS_DUE' | 'OD_UPDATE' | 'SUBMISSION_UPDATE' | 'SYSTEM';
  is_read: boolean;
  created_at: string;
  link_url?: string;
}

export interface NotificationListResponse {
  notifications: NotificationContract[];
  unread_count: number;
}

export interface MarkNotificationReadResponse {
  id: string;
  is_read: boolean;
  updated_at: string;
}

import { Notification as UINotification } from '@/types';

export function mapContractToNotification(c: NotificationContract): UINotification {
  return {
    id: c.id,
    userId: c.user_id,
    title: c.title,
    message: c.message,
    type: c.type,
    isRead: c.is_read,
    createdAt: c.created_at,
    linkUrl: c.link_url,
  };
}

export function mapNotificationToContract(u: UINotification): NotificationContract {
  return {
    id: u.id,
    user_id: u.userId,
    title: u.title,
    message: u.message,
    type: u.type,
    is_read: u.isRead,
    created_at: u.createdAt,
    link_url: u.linkUrl,
  };
}

