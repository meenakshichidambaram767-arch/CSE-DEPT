/**
 * Data Model Mappers: UI Models <-> API Contract v2.0 Models
 * SIET CSE Department Platform
 *
 * Ensures clean separation between UI camelCase convenience and
 * authoritative snake_case API Contract payloads and responses.
 */

import {
  Activity,
  ActivityType,
  DocumentItem,
  ODApplication,
  ODPurpose,
  ODStatus,
  TeamMember,
  WeeklyProgress,
} from '@/types';
import {
  ApiActivity,
  ApiODRequest,
  ApiWeeklyProgress,
  CreateActivityPayload,
  CreateODPayload,
  ReviewProgressPayload,
} from '@/types/contract';

// ==========================================
// 1. TIME & DATE FORMATTERS (CONTRACT ADHERENCE)
// ==========================================

/**
 * Normalizes any presentation or partial time string to strict contract HH:MM:SS format.
 * Examples:
 *   "09:00 AM" -> "09:00:00"
 *   "2:30 PM"  -> "14:30:00"
 *   "09:15"    -> "09:15:00"
 *   "14:30:00" -> "14:30:00"
 */
export function formatTimeToHHMMSS(timeStr?: string): string {
  if (!timeStr || !timeStr.trim()) {
    return '09:00:00';
  }

  const clean = timeStr.trim();

  // Check 12-hour AM/PM format (e.g., "09:30 AM", "2:00 PM")
  const ampmMatch = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = ampmMatch[2];
    const seconds = ampmMatch[3] || '00';
    const period = ampmMatch[4].toUpperCase();

    if (period === 'PM' && hours < 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
  }

  // Check 24-hour HH:MM or HH:MM:SS format
  const match24 = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match24) {
    const hours = String(parseInt(match24[1], 10)).padStart(2, '0');
    const minutes = match24[2];
    const seconds = match24[3] || '00';
    return `${hours}:${minutes}:${seconds}`;
  }

  return '09:00:00';
}

/**
 * Normalizes date string to YYYY-MM-DD
 */
export function formatDateToYYYYMMDD(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) {
    return new Date().toISOString().split('T')[0];
  }

  const clean = dateStr.trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  // Parse valid JS Date or ISO string
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return clean;
}

/**
 * Calculates total days between two date strings (inclusive), returning minimum 1.
 */
export function calculateTotalDays(startDateStr?: string, endDateStr?: string, explicitTotal?: number): number {
  if (explicitTotal && explicitTotal > 0) return explicitTotal;
  if (!startDateStr) return 1;
  const start = formatDateToYYYYMMDD(startDateStr);
  const end = formatDateToYYYYMMDD(endDateStr || startDateStr);
  if (start === end) return 1;
  const d1 = new Date(start);
  const d2 = new Date(end);
  const diffTime = d2.getTime() - d1.getTime();
  if (diffTime < 0) return 1;
  const days = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return isNaN(days) || days < 1 ? 1 : days;
}

// ==========================================
// 2. OD REQUEST MAPPERS
// ==========================================

export function mapODApplicationToApiPayload(od: Partial<ODApplication>): CreateODPayload {
  const startDate = formatDateToYYYYMMDD(od.startDate || od.date);
  const endDate = formatDateToYYYYMMDD(od.endDate || od.startDate || od.date);
  const fromTime = formatTimeToHHMMSS(od.fromTime);
  const toTime = formatTimeToHHMMSS(od.toTime);

  const teamMembers = (od.teamMembers || []).map((m) => ({
    register_number: m.regNo || (m as { registerNumber?: string }).registerNumber || '',
    name: m.name,
    role: m.role || 'MEMBER',
  }));

  const docIds = od.documentIds
    ? [...od.documentIds]
    : (od.documents || []).map((d) => d.id).filter(Boolean);

  const totalDays = calculateTotalDays(startDate, endDate, od.totalDays);

  return {
    event_id: od.eventId || null,
    activity_id: od.activityId || null,
    purpose: (od.purpose as ODPurpose) || 'OTHER',
    event_name: od.eventName || od.hackathonName || od.projectName || 'Academic On-Duty',
    reason: od.reason || od.additionalNotes || 'Academic Participation',
    start_date: startDate,
    end_date: endDate,
    from_time: fromTime,
    to_time: toTime,
    slot_type: od.slotType || 'FULL_DAY',
    total_days: totalDays,
    venue: od.venue || 'On Campus',
    registration_id: od.registrationId,
    team_members: teamMembers,
    document_ids: docIds,
    organization: od.organization,
    company_name: od.companyName,
    company_role: od.role,
    company_location: od.location,
    additional_notes: od.additionalNotes,
  };
}

export function mapApiODToODApplication(apiOD: ApiODRequest): ODApplication {
  const teamMembers: TeamMember[] = (apiOD.team_members || []).map((m) => ({
    name: m.name,
    regNo: m.register_number,
    email: '',
    role: m.role || 'MEMBER',
  }));

  const documents: DocumentItem[] = (apiOD.documents || []).map((d) => ({
    id: d.id,
    name: d.file_name,
    type: d.document_type,
    size: d.size ? `${Math.round(d.size / 1024)} KB` : '1.2 MB',
    uploadDate: apiOD.created_at,
    url: d.storage_path,
  }));

  return {
    id: apiOD.id,
    code: apiOD.code,
    studentId: apiOD.student_id,
    studentName: apiOD.student_name,
    studentRegNo: apiOD.student_reg_no,
    department: apiOD.department,
    year: apiOD.year,
    section: apiOD.section,
    purpose: apiOD.purpose,
    eventId: apiOD.event_id || undefined,
    activityId: apiOD.activity_id || undefined,
    eventName: apiOD.event_name,
    reason: apiOD.reason,
    startDate: apiOD.start_date,
    endDate: apiOD.end_date,
    fromTime: apiOD.from_time,
    toTime: apiOD.to_time,
    slotType: apiOD.slot_type,
    totalDays: apiOD.total_days,
    venue: apiOD.venue,
    registrationId: apiOD.registration_id,
    companyName: apiOD.company_name,
    role: apiOD.company_role,
    location: apiOD.company_location,
    teamMembers,
    documents,
    documentIds: apiOD.document_ids || [],
    status: apiOD.status as ODStatus,
    rejectionReason: apiOD.rejection_reason,
    revisionNotes: apiOD.revision_notes,
    submittedDate: apiOD.submitted_date || apiOD.created_at,
    approvedDate: apiOD.approved_date,
    remarks: apiOD.remarks,
  };
}

// ==========================================
// 3. ACTIVITY MAPPERS
// ==========================================

export function mapActivityToApiPayload(activity: Partial<Activity>): CreateActivityPayload {
  const teamMembers = (activity.teamMembers || []).map((m) => ({
    register_number: m.regNo || (m as { registerNumber?: string }).registerNumber || '',
    name: m.name,
    role: m.role || 'MEMBER',
    email: m.email,
  }));

  const docIds = activity.documentIds
    ? [...activity.documentIds]
    : (activity.documents || []).map((d) => d.id).filter(Boolean);

  return {
    type: (activity.type as ActivityType) || 'PROJECT',
    title: activity.title || '',
    description: activity.description || '',
    technologies: activity.technologies || [],
    start_date: formatDateToYYYYMMDD(activity.startDate),
    end_date: activity.endDate ? formatDateToYYYYMMDD(activity.endDate) : undefined,
    organization: activity.organization,
    company_name: activity.company || activity.organization,
    company_role: activity.role,
    company_location: activity.location,
    stipend: activity.stipend,
    github_url: activity.githubUrl,
    demo_url: activity.demoUrl,
    guide_name: activity.guideName || activity.supervisorName,
    guide_email: activity.guideEmail || activity.supervisorEmail,
    team_members: teamMembers,
    document_ids: docIds,
  };
}

export function mapApiActivityToActivity(apiAct: ApiActivity): Activity {
  const teamMembers: TeamMember[] = (apiAct.team_members || []).map((m) => ({
    name: m.name,
    regNo: m.register_number,
    email: m.email || '',
    role: m.role || 'MEMBER',
  }));

  return {
    id: apiAct.id,
    code: apiAct.code,
    studentId: apiAct.student_id,
    studentName: apiAct.student_name,
    studentRegNo: apiAct.student_reg_no,
    department: apiAct.department,
    year: apiAct.year,
    type: apiAct.type,
    title: apiAct.title,
    description: apiAct.description,
    technologies: apiAct.technologies || [],
    startDate: apiAct.start_date,
    endDate: apiAct.end_date || apiAct.start_date,
    organization: apiAct.organization,
    company: apiAct.company_name,
    role: apiAct.company_role,
    location: apiAct.company_location,
    stipend: apiAct.stipend,
    githubUrl: apiAct.github_url,
    demoUrl: apiAct.demo_url,
    guideName: apiAct.guide_name,
    guideEmail: apiAct.guide_email,
    teamMembers,
    documentIds: apiAct.document_ids || [],
    documents: [],
    timeline: [],
    status: apiAct.status,
    rejectionReason: apiAct.rejection_reason,
    revisionNotes: apiAct.revision_notes,
    createdAt: apiAct.created_at,
    updatedAt: apiAct.updated_at,
  };
}

// ==========================================
// 4. WEEKLY REVIEW PROGRESS MAPPERS
// ==========================================

export function mapWeeklyProgressToApiPayload(progress: Partial<WeeklyProgress>): ReviewProgressPayload {
  return {
    completed_this_week: progress.completedThisWeek || '',
    currently_working_on: progress.currentlyWorkingOn || '',
    next_week_goal: progress.nextWeekGoal || '',
    blockers: progress.blockers || '',
    github_url: progress.githubUrl,
  };
}

export function mapApiProgressToWeeklyProgress(
  apiProg: ApiWeeklyProgress,
  studentName?: string
): WeeklyProgress {
  return {
    id: apiProg.id,
    reviewSessionId: apiProg.review_session_id,
    studentId: apiProg.student_id,
    studentName: studentName || 'Student',
    completedThisWeek: apiProg.completed_this_week,
    currentlyWorkingOn: apiProg.currently_working_on,
    nextWeekGoal: apiProg.next_week_goal,
    blockers: apiProg.blockers,
    githubUrl: apiProg.github_url,
    submittedAt: apiProg.submitted_at,
  };
}

export function mapApiReviewToReviewSession(apiReview: import('@/types/contract').ApiReviewSession): import('@/types').ReviewSession {
  const studentTeam: TeamMember[] = (apiReview.student_team || []).map((m) => ({
    name: m.name,
    regNo: m.register_number,
    email: m.email || '',
    role: m.role || 'Member',
  }));

  const attendance: import('@/types').AttendanceItem[] = (apiReview.attendance || []).map((a) => ({
    studentId: a.student_id,
    name: a.name,
    regNo: a.register_number,
    attended: a.attended,
    checkInTime: a.check_in_time,
  }));

  const leadMember = studentTeam[0];

  return {
    id: apiReview.id,
    code: apiReview.code,
    activityId: apiReview.activity_id,
    activityTitle: apiReview.activity_title,
    activityType: apiReview.activity_type,
    studentName: leadMember?.name || 'Student Lead',
    studentRegNo: leadMember?.regNo || '',
    reviewNumber: apiReview.review_number,
    reviewType: apiReview.review_type,
    date: apiReview.date,
    rawDate: apiReview.date,
    time: apiReview.time,
    venue: apiReview.venue,
    facultyReviewer: apiReview.faculty_reviewer,
    status: apiReview.status,
    studentTeam,
    progress: apiReview.progress ? mapApiProgressToWeeklyProgress(apiReview.progress, leadMember?.name) : undefined,
    attendance,
    meetingNotes: apiReview.meeting_notes,
    nextWeekGoal: apiReview.next_week_goal,
    qrCodeToken: apiReview.qr_code_token,
    createdAt: apiReview.created_at,
  };
}

