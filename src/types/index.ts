/**
 * Core Domain TypeScript Types
 * Student Hackathon, Project & Internship Tracking Platform
 */

export type UserRole = 'STUDENT' | 'HOD';

export type ActivityType = 'PROJECT' | 'INTERNSHIP' | 'HACKATHON';

export type ActivityStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'PENDING_APPROVAL'
  | 'REVISION_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'IN_PROGRESS'
  | 'REVIEW_DUE'
  | 'REVIEW_COMPLETED'
  | 'COMPLETED';

export type ODStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REVISION_REQUESTED'
  | 'REJECTED'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'PENDING_SUBMISSION'
  | 'NOT_REQUIRED';

export type AllStatus = ActivityStatus | ODStatus;

export type ReviewSessionStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

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
  role: UserRole;
  avatar?: string;
  designation?: string;
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

// Backward-compatibility aliases
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

export interface ReviewScore {
  technicalKnowledge: number;
  implementation: number;
  presentation: number;
  problemUnderstanding: number;
  progress: number;
}

export interface ReviewSession {
  id: string;
  activityId: string;
  activityTitle: string;
  activityType: ActivityType;
  studentName?: string;
  studentRegNo?: string;
  reviewNumber: number;
  reviewType?: string;
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
  scores?: ReviewScore;
  totalScore?: number;
  feedback?: string;
  qrCodeToken?: string;
  createdAt?: string;
}

export type Review = ReviewSession;

export interface ODApplication {
  id: string;
  studentId: string;
  studentName: string;
  studentRegNo: string;
  department: string;
  year: string;
  activityId?: string;
  activityTitle?: string;
  activityType?: ActivityType;
  reason: string;
  eventName: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  fromTime?: string;
  toTime?: string;
  totalDays?: number;
  venue?: string;
  proofUrl?: string;
  proofDocName?: string;
  documents?: DocumentItem[];
  additionalNotes?: string;
  status: ODStatus;
  rejectionReason?: string;
  revisionNotes?: string;
  submittedDate: string;
  approvedDate?: string;
  remarks?: string;
}

export type ODSubmission = ODApplication;

export interface StudentStats {
  totalActivities: number;
  approvedActivities: number;
  totalODs: number;
  approvedODs: number;
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
