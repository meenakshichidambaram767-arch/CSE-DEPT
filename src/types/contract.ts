/**
 * Authoritative API Contract v2.0 TypeScript Definitions
 * SIET CSE Department Platform - Full System Alignment
 *
 * Source: SIET CSE Department Platform - API Contract v2.0
 */

// ==========================================
// 1. GLOBAL PROTOCOL & ENVELOPE TYPES
// ==========================================

export interface ApiErrorDetail {
  field?: string;
  [key: string]: unknown;
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail;
  };
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiSuccessEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

// ==========================================
// 2. ENUMS & CONSTANTS
// ==========================================

export type ApiUserRole = 'STUDENT' | 'HOD';

export type ApiODStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';

export type ApiODPurpose =
  | 'HACKATHON'
  | 'PROJECT'
  | 'INTERNSHIP'
  | 'WORKSHOP'
  | 'COMPETITION'
  | 'CONFERENCE'
  | 'OTHER';

export type ApiTimeSlotType = 'FULL_DAY' | 'FORENOON' | 'AFTERNOON' | 'PERIOD_CUSTOM';

export type ApiActivityType = 'PROJECT' | 'HACKATHON' | 'INTERNSHIP';

export type ApiActivityStatus =
  | 'SUBMITTED'
  | 'ACTIVE'
  | 'REJECTED'
  | 'REVISION_REQUESTED'
  | 'COMPLETED';

export type ApiReviewType =
  | 'PROJECT_WEEKLY'
  | 'HACKATHON_POST'
  | 'INTERNSHIP_MID'
  | 'INTERNSHIP_FINAL';

export type ApiReviewSessionStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export type ApiDocumentOwner = 'od_request' | 'activity' | 'event';

export type ApiNotificationType =
  | 'REVIEW_REMINDER'
  | 'PROGRESS_DUE'
  | 'OD_UPDATE'
  | 'SUBMISSION_UPDATE'
  | 'SYSTEM';

// ==========================================
// 3. AUTHENTICATION & IDENTITY
// ==========================================

export interface ApiUserProfile {
  id: string;
  name: string;
  email: string;
  role: ApiUserRole;
  register_number?: string;
  department?: string;
  year?: string;
  section?: string;
  designation?: string;
}

export interface ApiMeResponse {
  data: {
    id: string;
    email: string;
    name: string;
    role: ApiUserRole;
    profile?: Record<string, unknown>;
  };
}

// ==========================================
// 4. ON-DUTY (OD) REQUESTS
// ==========================================

export interface ApiODTeamMember {
  register_number: string;
  name: string;
  role?: string;
}

export interface CreateODPayload {
  event_id?: string | null;
  activity_id?: string | null;
  purpose: ApiODPurpose;
  event_name: string;
  reason?: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  from_time: string;  // HH:MM:SS
  to_time: string;    // HH:MM:SS
  slot_type?: ApiTimeSlotType;
  total_days: number;
  venue: string;
  registration_id?: string;
  team_members?: ApiODTeamMember[];
  document_ids?: string[];
  organization?: string;
  company_name?: string;
  company_role?: string;
  company_location?: string;
  additional_notes?: string;
}

export interface ResubmitODPayload extends Partial<CreateODPayload> {
  revision_notes?: string;
}

export interface ODDecisionPayload {
  decision: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  remarks?: string | null;
  rejection_reason?: string | null;
  revision_notes?: string | null;
}

export interface BulkODDecisionPayload {
  od_ids: string[];
  decision: 'APPROVED' | 'REJECTED';
  remarks?: string;
}

export interface ApiODConflictItem {
  od_id: string;
  event_name: string;
  start_date: string;
  end_date: string;
  student_name: string;
  register_number: string;
}

export interface ODConflictResponse {
  has_conflict: boolean;
  conflicts?: ApiODConflictItem[];
}

export interface ApiODRequest {
  id: string;
  code?: string;
  student_id: string;
  student_name: string;
  student_reg_no: string;
  department: string;
  year: string;
  section?: string;
  purpose: ApiODPurpose;
  event_id?: string | null;
  activity_id?: string | null;
  event_name: string;
  reason: string;
  start_date: string;
  end_date: string;
  from_time: string;
  to_time: string;
  slot_type?: ApiTimeSlotType;
  total_days: number;
  venue: string;
  registration_id?: string;
  company_name?: string;
  company_role?: string;
  company_location?: string;
  team_members?: ApiODTeamMember[];
  document_ids?: string[];
  documents?: Array<{
    id: string;
    file_name: string;
    document_type: string;
    storage_path?: string;
    size?: number;
  }>;
  status: ApiODStatus;
  remarks?: string;
  rejection_reason?: string;
  revision_notes?: string;
  submitted_date: string;
  approved_date?: string;
  created_at: string;
  updated_at?: string;
}

// ==========================================
// 5. ACTIVITY TRACKING (PROJECTS, HACKATHONS, INTERNSHIPS)
// ==========================================

export interface ApiActivityTeamMember {
  register_number: string;
  name: string;
  role?: string;
  email?: string;
}

export interface CreateActivityPayload {
  type: ApiActivityType;
  title: string;
  description: string;
  technologies?: string[];
  start_date: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
  organization?: string;
  company_name?: string;
  company_role?: string;
  company_location?: string;
  stipend?: string;
  github_url?: string;
  demo_url?: string;
  guide_name?: string;
  guide_email?: string;
  team_members?: ApiActivityTeamMember[];
  document_ids?: string[];
}

export interface ActivityDecisionPayload {
  decision: 'ACTIVE' | 'REJECTED' | 'REVISION_REQUESTED';
  remarks?: string | null;
  rejection_reason?: string | null;
  revision_notes?: string | null;
}

export interface ResubmitActivityPayload extends Partial<CreateActivityPayload> {
  revision_notes?: string;
}

export interface ApiActivity {
  id: string;
  code?: string;
  student_id: string;
  student_name: string;
  student_reg_no: string;
  department: string;
  year: string;
  type: ApiActivityType;
  title: string;
  description: string;
  technologies: string[];
  start_date: string;
  end_date?: string;
  organization?: string;
  company_name?: string;
  company_role?: string;
  company_location?: string;
  stipend?: string;
  github_url?: string;
  demo_url?: string;
  guide_name?: string;
  guide_email?: string;
  team_members: ApiActivityTeamMember[];
  document_ids?: string[];
  status: ApiActivityStatus;
  rejection_reason?: string;
  revision_notes?: string;
  created_at: string;
  updated_at?: string;
}

// ==========================================
// 6. WEEKLY REVIEW ENGINE (NON-EVALUATIVE)
// ==========================================

export interface BatchScheduleReviewsPayload {
  activity_id: string;
  review_type?: ApiReviewType;
  frequency?: 'WEEKLY' | 'BIWEEKLY' | 'SPRINT_4_WEEK';
  start_date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS or HH:MM
  venue: string;
  count?: number;
  faculty_reviewer?: string;
}

/**
 * Mandatory 4-Quadrant Non-Evaluative Student Progress Submission
 * PRD §5.3, Test TC-21: Completely non-evaluative; no rubric scores, grading, or marks.
 */
export interface ReviewProgressPayload {
  completed_this_week: string;
  currently_working_on: string;
  next_week_goal: string;
  blockers: string;
  github_url?: string;
}

export interface GenerateQrResponse {
  token: string;
  expires_at: string;
  session_id: string;
}

export interface ReviewCheckInPayload {
  token: string;
}

export interface ReviewCheckInResponse {
  success: boolean;
  check_in_time: string;
  student_id: string;
  register_number: string;
}

export interface FinalizeReviewPayload {
  meeting_notes: string;
  next_week_goal?: string;
  attendance?: Array<{
    student_id: string;
    attended: boolean;
  }>;
}

export interface ApiReviewAttendance {
  student_id: string;
  name: string;
  register_number: string;
  attended: boolean;
  check_in_time?: string;
}

export interface ApiWeeklyProgress {
  id: string;
  review_session_id: string;
  student_id: string;
  completed_this_week: string;
  currently_working_on: string;
  next_week_goal: string;
  blockers: string;
  github_url?: string;
  submitted_at: string;
}

export interface ApiReviewSession {
  id: string;
  code?: string;
  activity_id: string;
  activity_title: string;
  activity_type: ApiActivityType;
  review_type: ApiReviewType;
  review_number: number;
  date: string;
  time: string;
  venue: string;
  status: ApiReviewSessionStatus;
  faculty_reviewer?: string;
  student_team: ApiActivityTeamMember[];
  progress?: ApiWeeklyProgress;
  attendance: ApiReviewAttendance[];
  meeting_notes?: string;
  next_week_goal?: string;
  qr_code_token?: string;
  created_at: string;
}

// ==========================================
// 7. DEPARTMENTAL RECORDS & SLIDE-OVER
// ==========================================

export interface ApiStudentRecord {
  id: string;
  userId: string;
  registerNumber: string;
  regNo: string;
  name: string;
  department: string;
  year: string;
  section: string;
  email: string;
  createdAt: string;
}

export interface ApiStudentSummaryStats {
  total_ods: number;
  approved_ods: number;
  total_activities: number;
  active_activities: number;
  total_reviews: number;
  attendance_rate: number;
}

export interface ApiStudentSummary {
  student: ApiStudentRecord;
  stats: ApiStudentSummaryStats;
  recent_ods: ApiODRequest[];
  activities: ApiActivity[];
  reviews: ApiReviewSession[];
}

// ==========================================
// 8. ACCREDITATION & REPORTING
// ==========================================

export interface ApiAccreditationCriteria132 {
  label: string;
  count: number;
  active_capstones: number;
}

export interface ApiAccreditationCriteria531 {
  label: string;
  count: number;
  unique_students: number;
}

export interface ApiAccreditationCriteria133 {
  label: string;
  count: number;
  verified: number;
}

export interface ApiAccreditationMetrics {
  academic_year: string;
  department: string;
  metrics: {
    criteria_1_3_2: ApiAccreditationCriteria132;
    criteria_5_3_1: ApiAccreditationCriteria531;
    criteria_1_3_3: ApiAccreditationCriteria133;
    total_approved_od_clearances: number;
  };
}

export interface ApiReportSummary {
  total_students: number;
  active_ods: number;
  total_activities: number;
  upcoming_reviews: number;
}

// ==========================================
// 9. POLYMORPHIC DOCUMENTS & NOTIFICATIONS
// ==========================================

export interface DocumentUploadPayload {
  file_name: string;
  document_type: string;
  storage_path: string;
  size?: number;
  owner: ApiDocumentOwner;
  owner_id: string;
}

export interface DocumentUploadResponse {
  id: string;
  fileName: string;
  documentType: string;
  storagePath: string;
  size: number;
  owner: ApiDocumentOwner;
  ownerId: string;
  uploadedBy: string;
  createdAt: string;
}

export interface DocumentSignedUrlResponse {
  id: string;
  fileName: string;
  documentType: string;
  storagePath: string;
  size: number;
  signedUrl: string;
  expiresInSeconds: number;
  createdAt: string;
}

export interface ApiNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: ApiNotificationType;
  isRead: boolean;
  createdAt: string;
  linkUrl?: string;
}

export interface NotificationReadResponse {
  success: boolean;
  id?: string;
  readCount?: number;
}
