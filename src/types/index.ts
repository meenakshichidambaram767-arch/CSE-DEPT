/**
 * Core Domain TypeScript Types
 * SIET CSE Department Platform - API Contract v2.0 & PRD v2.0
 */

export * from './student';
export * from './contract';
import {
  ApiUserRole,
  ApiActivityType,
  ApiActivityStatus,
  ApiODStatus,
  ApiReviewSessionStatus,
  ApiReviewType,
  ApiTimeSlotType,
} from './contract';

export type UserRole = ApiUserRole;
export type ActivityType = ApiActivityType;
export type ReviewSessionStatus = ApiReviewSessionStatus;

export type ActivityStatus =
  | ApiActivityStatus
  | 'APPROVED'
  | 'UNDER_REVIEW'
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'REVIEW_DUE'
  | 'REVIEW_COMPLETED'
  | 'PENDING_APPROVAL';

export type ODStatus =
  | ApiODStatus
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'PENDING_SUBMISSION'
  | 'NOT_REQUIRED';

export type AllStatus = ActivityStatus | ODStatus;

export type EventStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CLOSED';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  registerNumber?: string;
  department: string;
  year?: string;
  section?: string;
  role: UserRole;
  avatar?: string;
  designation?: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  registerNumber: string;
  name: string;
  department: string;
  year: 'I' | 'II' | 'III' | 'IV';
  section: 'A' | 'B' | 'C' | 'D' | 'E';
  email: string;
}

export interface HodProfile {
  id: string;
  userId: string;
  name: string;
  designation: string;
  department: string;
}

export interface TeamMember {
  id?: string;
  name: string;
  regNo: string;
  email: string;
  role?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  url?: string;
}

export interface TimelineEvent {
  id: string;
  date?: string;
  title: string;
  description?: string;
  status: 'COMPLETED' | 'CURRENT' | 'UPCOMING' | 'FAILED';
}

export type TimelineStep = TimelineEvent;

export interface Activity {
  id: string;
  code?: string;
  studentId: string;
  studentName: string;
  studentRegNo: string;
  department: string;
  year: string;
  type: ActivityType;
  title: string;
  description: string;
  problemStatement?: string;
  progress?: number;
  organization?: string;
  company?: string;
  role?: string;
  location?: string;
  internshipType?: string;
  mode?: string;
  supervisorName?: string;
  supervisorEmail?: string;
  stipend?: string;
  result?: string;
  eventName?: string;
  startDate: string;
  endDate: string;
  submittedDate?: string;
  technologies: string[];
  githubUrl?: string;
  demoUrl?: string;
  proofUrl?: string;
  proofDocName?: string;
  documents?: DocumentItem[];
  documentIds?: string[];
  additionalNotes?: string;
  teamMembers: TeamMember[];
  status: ActivityStatus;
  rejectionReason?: string;
  revisionNotes?: string;
  timeline: TimelineEvent[];
  odStatus?: ODStatus;
  reviewCount?: number;
  guideName?: string;
  guideEmail?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type Project = Activity;
export type Internship = Activity;
export type Hackathon = Activity;

export interface WeeklyProgress {
  id: string;
  reviewSessionId: string;
  studentId: string;
  studentName: string;
  completedThisWeek: string;
  currentlyWorkingOn: string;
  nextWeekGoal: string;
  blockers: string;
  githubUrl?: string;
  submittedAt: string;
}

export interface AttendanceItem {
  studentId: string;
  name: string;
  regNo: string;
  attended: boolean;
  checkInTime?: string;
}

export * from './contract';

export type ReviewType = ApiReviewType;

export interface ReviewSession {
  id: string;
  code?: string;
  activityId: string;
  activityTitle: string;
  activityType: ActivityType;
  studentName?: string;
  studentRegNo?: string;
  reviewNumber: number;
  reviewType?: ReviewType | string;
  date: string;
  rawDate?: string; // YYYY-MM-DD
  time: string;
  venue: string;
  facultyReviewer?: string;
  status: ReviewSessionStatus;
  studentTeam: TeamMember[];
  progress?: WeeklyProgress;
  attendance: AttendanceItem[];
  meetingNotes?: string;
  nextWeekGoal?: string;
  feedback?: string;
  qrCodeToken?: string;
  createdAt?: string;
}

export type Review = ReviewSession;

export type ODPurpose =
  | 'HACKATHON'
  | 'PROJECT'
  | 'INTERNSHIP'
  | 'WORKSHOP'
  | 'COMPETITION'
  | 'CONFERENCE'
  | 'OTHER';

export interface AuditLog {
  id: string;
  date: string;
  time: string;
  actorName: string;
  actorRole: UserRole;
  actionTitle: string;
  details: string;
  targetId?: string;
}

export interface ODConflict {
  hasConflict: boolean;
  conflictingEventName?: string;
  conflictingDate?: string;
  conflictingTime?: string;
  conflictingStudentRegNo?: string;
  conflictingStudentName?: string;
}

export interface ODEvent {
  id: string;
  title: string;
  purpose: ODPurpose;
  date: string;
  formattedDate: string;
  endDate?: string;
  venue: string;
  city?: string;
  studentCount: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  status: EventStatus;
  documents: DocumentItem[];
  odRequestIds: string[];
}

export interface ODApplication {
  id: string;
  code?: string;
  studentId: string;
  studentName: string;
  studentRegNo: string;
  department: string;
  year: string;
  section?: string;
  eventId?: string;
  purpose: ODPurpose;
  activityId?: string;
  activityTitle?: string;
  activityType?: ActivityType;
  reason: string;
  eventName: string;
  organization?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  fromTime?: string;
  toTime?: string;
  slotType?: ApiTimeSlotType;
  totalDays?: number;
  venue?: string;
  documentIds?: string[];

  // Hackathon specific fields
  hackathonName?: string;
  registrationId?: string;
  teamMembers?: TeamMember[];

  // Project specific fields
  projectName?: string;
  projectType?: string;

  // Internship specific fields
  companyName?: string;
  role?: string;
  location?: string;
  internshipStartDate?: string;
  internshipEndDate?: string;

  // Document management
  proofUrl?: string;
  proofDocName?: string;
  documents?: DocumentItem[];
  postEventDocsSubmitted?: boolean;
  postEventCertUrl?: string;

  additionalNotes?: string;
  status: ODStatus;
  rejectionReason?: string;
  revisionNotes?: string;
  submittedDate: string;
  approvedDate?: string;
  remarks?: string;
  timeline?: TimelineEvent[];
  auditTrail?: AuditLog[];
  conflict?: ODConflict;
}

export type ODSubmission = ODApplication;

export interface StudentStats {
  totalActivities: number;
  approvedActivities: number;
  totalODs: number;
  approvedODs: number;
  totalODDays: number;
  attendanceRate: string;
  standing: string;
  recentActivityTitles: string[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'REVIEW_REMINDER' | 'PROGRESS_DUE' | 'OD_UPDATE' | 'SUBMISSION_UPDATE' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
  linkUrl?: string;
}

export interface MetricItem {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  description?: string;
  icon?: string;
}

/**
 * Standard RFC 7807 Error Envelope & Pagination Types (API Contract v2.0)
 */
export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: {
      field?: string;
      [key: string]: unknown;
    };
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
