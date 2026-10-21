/**
 * Shared API Serializer Helpers
 * Ensures every backend response at /api/v1/* strictly adheres to snake_case wire format
 * matching Authoritative API Contract v2.0 (src/types/contract.ts).
 */

import {
  ApiActivity,
  ApiActivityTeamMember,
  ApiActivityType,
  ApiNotification,
  ApiODConflictItem,
  ApiODPurpose,
  ApiODRequest,
  ApiODStatus,
  ApiODTeamMember,
  ApiReviewAttendance,
  ApiReviewSession,
  ApiReviewSessionStatus,
  ApiReviewType,
  ApiStudentRecord,
  ApiTimeSlotType,
  ApiWeeklyProgress,
  DocumentSignedUrlResponse,
  DocumentUploadResponse,
} from '@/types/contract';

/**
 * Checks recursively if an object or array contains any camelCase keys.
 * Returns a list of offending key paths.
 */
export function findCamelCaseKeys(obj: unknown, path: string = ''): string[] {
  const violations: string[] = [];
  if (!obj || typeof obj !== 'object') return violations;

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      violations.push(...findCamelCaseKeys(item, `${path}[${index}]`));
    });
    return violations;
  }

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const fullPath = path ? `${path}.${key}` : key;
    // Check if key contains a lowercase followed by uppercase character (camelCase)
    if (/[a-z][A-Z]/.test(key)) {
      violations.push(fullPath);
    }
    if (value && typeof value === 'object') {
      violations.push(...findCamelCaseKeys(value, fullPath));
    }
  }

  return violations;
}

/**
 * Serializes an On-Duty (OD) request row to strict snake_case wire format.
 * Shared by GET list, GET detail, POST submit, PUT resubmit, and POST decision endpoints.
 */
export function serializeODRequest(
  row: Record<string, any>,
  extra?: {
    team_members?: any[];
    teamMembers?: any[];
    documents?: any[];
    status_history?: any[];
    statusHistory?: any[];
    conflicts?: any[];
  }
): ApiODRequest & Record<string, unknown> {
  const student = row.students || row.student || {};
  const studentName = row.student_name || row.studentName || student.name || 'Student';
  const studentRegNo =
    row.student_reg_no || row.studentRegNo || student.register_number || student.reg_no || '';
  const department = row.department || student.department || 'CSE';
  const year = row.year || student.year || 'II';
  const section = row.section || student.section || 'A';

  const teamMembersRaw =
    extra?.team_members ||
    extra?.teamMembers ||
    row.team_members ||
    row.teamMembers ||
    row.od_team_members ||
    [];

  const team_members: ApiODTeamMember[] = teamMembersRaw.map((m: any) => ({
    register_number: m.register_number || m.registerNumber || m.reg_no || m.regNo || '',
    name: m.name || '',
    role: m.role || 'MEMBER',
  }));

  const docsRaw = extra?.documents || row.documents || [];
  const documents = docsRaw.map((d: any) => ({
    id: d.id,
    file_name: d.file_name || d.fileName || d.name || 'document.pdf',
    document_type: d.document_type || d.documentType || d.type || 'PROOF',
    storage_path: d.storage_path || d.storagePath || d.path || '',
    size:
      typeof d.size === 'number'
        ? d.size
        : typeof d.size === 'string' && d.size.includes('KB')
          ? parseInt(d.size) * 1024
          : 1024,
  }));

  const docIds: string[] =
    row.document_ids || row.documentIds || documents.map((d: any) => d.id).filter(Boolean);

  const res: Record<string, any> = {
    id: row.id,
    code: row.code || undefined,
    student_id: row.student_id || row.studentId || student.id || '',
    student_name: studentName,
    student_reg_no: studentRegNo,
    department,
    year,
    section,
    purpose: row.purpose as ApiODPurpose,
    event_id: row.event_id || row.eventId || null,
    activity_id: row.activity_id || row.activityId || null,
    event_name: row.event_name || row.eventName || '',
    organization: row.organization || null,
    reason: row.reason || '',
    start_date: row.start_date || row.startDate || row.date || '',
    end_date: row.end_date || row.endDate || row.start_date || row.startDate || '',
    from_time: row.from_time || row.fromTime || '09:00:00',
    to_time: row.to_time || row.toTime || '17:00:00',
    slot_type: (row.slot_type || row.slotType || 'FULL_DAY') as ApiTimeSlotType,
    total_days: Number(row.total_days || row.totalDays || 1),
    venue: row.venue || 'CSE Department',
    registration_id: row.registration_id || row.registrationId || null,
    company_name: row.company_name || row.companyName || null,
    company_role: row.company_role || row.companyRole || null,
    company_location: row.company_location || row.companyLocation || null,
    additional_notes: row.additional_notes || row.additionalNotes || null,
    team_members,
    document_ids: docIds,
    documents,
    status: row.status as ApiODStatus,
    remarks: row.remarks || null,
    rejection_reason: row.rejection_reason || row.rejectionReason || null,
    revision_notes: row.revision_notes || row.revisionNotes || null,
    submitted_date: row.submitted_date || row.submittedDate || row.created_at || new Date().toISOString(),
    approved_date: row.approved_date || row.approvedDate || null,
    created_at: row.created_at || row.createdAt || new Date().toISOString(),
    updated_at: row.updated_at || row.updatedAt || undefined,
  };

  const statusHistoryRaw =
    extra?.status_history ||
    extra?.statusHistory ||
    row.status_history ||
    row.statusHistory ||
    [];
  if (statusHistoryRaw.length > 0) {
    res.status_history = statusHistoryRaw.map((h: any) => ({
      id: h.id,
      old_status: h.old_status || h.oldStatus || 'NONE',
      new_status: h.new_status || h.newStatus || 'PENDING',
      note: h.note || null,
      changed_by: h.users?.name || h.changed_by || h.changedBy || 'System',
      changed_at: h.changed_at || h.changedAt || new Date().toISOString(),
    }));
  }

  const conflictsRaw = extra?.conflicts || row.conflicts || [];
  if (
    conflictsRaw.length > 0 ||
    row.has_conflict !== undefined ||
    row.hasConflict !== undefined
  ) {
    res.has_conflict = conflictsRaw.length > 0 || !!row.has_conflict || !!row.hasConflict;
    res.conflict_count = conflictsRaw.length;
    res.conflicts = conflictsRaw.map((c: any) => ({
      id: c.id,
      od_id: c.od_id || c.odId || c.id,
      code: c.code,
      event_name: c.event_name || c.eventName || '',
      purpose: c.purpose,
      start_date: c.start_date || c.startDate || '',
      end_date: c.end_date || c.endDate || '',
      status: c.status,
      conflict_type: c.conflict_type || c.conflictType || undefined,
      student_name: c.student_name || c.studentName || studentName,
      register_number: c.register_number || c.registerNumber || studentRegNo,
    }));
  }

  return res as ApiODRequest & Record<string, unknown>;
}

/**
 * Serializes an Activity row (Project, Hackathon, Internship) to strict snake_case wire format.
 * Shared by GET list, GET detail, POST submit, PUT resubmit, and POST decision endpoints.
 */
export function serializeActivity(
  row: Record<string, any>,
  extra?: {
    team_members?: any[];
    teamMembers?: any[];
    documents?: any[];
    status_history?: any[];
    statusHistory?: any[];
  }
): ApiActivity & Record<string, unknown> {
  const student = row.students || row.student || {};
  const studentName = row.student_name || row.studentName || student.name || 'Student';
  const studentRegNo =
    row.student_reg_no || row.studentRegNo || student.register_number || student.reg_no || '';
  const department = row.department || student.department || 'CSE';
  const year = row.year || student.year || 'II';
  const section = row.section || student.section || 'A';

  const teamMembersRaw =
    extra?.team_members ||
    extra?.teamMembers ||
    row.team_members ||
    row.teamMembers ||
    row.activity_team_members ||
    [];

  const team_members: ApiActivityTeamMember[] = teamMembersRaw.map((m: any) => ({
    register_number: m.register_number || m.registerNumber || m.reg_no || m.regNo || '',
    name: m.name || '',
    role: m.role || 'MEMBER',
    email: m.email || '',
  }));

  const docsRaw = extra?.documents || row.documents || [];
  const documents = docsRaw.map((d: any) => ({
    id: d.id,
    file_name: d.file_name || d.fileName || d.name || 'document.pdf',
    document_type: d.document_type || d.documentType || d.type || 'PROOF',
    storage_path: d.storage_path || d.storagePath || d.path || '',
    size:
      typeof d.size === 'number'
        ? d.size
        : typeof d.size === 'string' && d.size.includes('KB')
          ? parseInt(d.size) * 1024
          : 1024,
  }));

  const docIds: string[] =
    row.document_ids || row.documentIds || documents.map((d: any) => d.id).filter(Boolean);

  const res: Record<string, any> = {
    id: row.id,
    code: row.code || undefined,
    student_id: row.student_id || row.studentId || student.id || '',
    student_name: studentName,
    student_reg_no: studentRegNo,
    department,
    year,
    section,
    type: row.type as ApiActivityType,
    title: row.title || '',
    description: row.description || '',
    technologies: Array.isArray(row.technologies) ? row.technologies : [],
    start_date: row.start_date || row.startDate || '',
    end_date: row.end_date || row.endDate || undefined,
    organization: row.organization || null,
    company_name: row.company_name || row.companyName || null,
    company_role: row.company_role || row.companyRole || null,
    company_location: row.company_location || row.companyLocation || null,
    stipend: row.stipend || null,
    github_url: row.github_url || row.githubUrl || null,
    demo_url: row.demo_url || row.demoUrl || null,
    guide_name: row.guide_name || row.guideName || null,
    guide_email: row.guide_email || row.guideEmail || null,
    team_members,
    document_ids: docIds,
    documents,
    status: row.status,
    rejection_reason: row.rejection_reason || row.rejectionReason || null,
    revision_notes: row.revision_notes || row.revisionNotes || null,
    od_status: row.od_status || row.odStatus || undefined,
    review_count: Number(row.review_count || row.reviewCount || 0),
    created_at: row.created_at || row.createdAt || new Date().toISOString(),
    updated_at: row.updated_at || row.updatedAt || undefined,
  };

  const statusHistoryRaw =
    extra?.status_history ||
    extra?.statusHistory ||
    row.status_history ||
    row.statusHistory ||
    [];
  if (statusHistoryRaw.length > 0) {
    res.status_history = statusHistoryRaw.map((h: any) => ({
      id: h.id,
      old_status: h.old_status || h.oldStatus || 'NONE',
      new_status: h.new_status || h.newStatus || 'SUBMITTED',
      note: h.note || null,
      changed_by: h.users?.name || h.changed_by || h.changedBy || 'System',
      changed_at: h.changed_at || h.changedAt || new Date().toISOString(),
    }));
  }

  return res as ApiActivity & Record<string, unknown>;
}

/**
 * Serializes a Review Session row to strict snake_case wire format.
 * Shared by GET list, GET detail, POST schedule, and POST finalize endpoints.
 */
export function serializeReviewSession(
  row: Record<string, any>,
  extra?: {
    attendance?: any[];
    progress?: any[];
    team_members?: any[];
    teamMembers?: any[];
  }
): ApiReviewSession & Record<string, unknown> {
  const activity = row.activities || row.activity || {};
  const activityTitle = row.activity_title || row.activityTitle || activity.title || '';
  const activityType = (row.activity_type || row.activityType || activity.type || 'PROJECT') as ApiActivityType;

  const attendanceRaw = extra?.attendance || row.attendance || [];
  const attendance: ApiReviewAttendance[] = attendanceRaw.map((a: any) => ({
    student_id: a.student_id || a.studentId || '',
    name: a.students?.name || a.name || a.studentName || '',
    register_number:
      a.students?.register_number || a.register_number || a.studentRegNo || a.regNo || '',
    attended: !!a.attended,
    check_in_time: a.check_in_time || a.checkInTime || undefined,
  }));

  const progressRaw =
    extra?.progress ||
    (row.progress_reports
      ? row.progress_reports
      : row.progress
        ? [row.progress]
        : []);
  const progressReports: ApiWeeklyProgress[] = progressRaw.map((p: any) =>
    serializeWeeklyProgress(p)
  );

  const teamMembersRaw =
    extra?.team_members ||
    extra?.teamMembers ||
    row.student_team ||
    row.studentTeam ||
    activity.activity_team_members ||
    [];

  const student_team: ApiActivityTeamMember[] = teamMembersRaw.map((m: any) => ({
    register_number: m.register_number || m.registerNumber || m.reg_no || m.regNo || '',
    name: m.name || '',
    role: m.role || 'MEMBER',
    email: m.email || '',
  }));

  let title = `Weekly Review #${row.review_number}`;
  if (row.review_type === 'HACKATHON_POST') {
    title = 'Post-Hackathon Review';
  } else if (row.review_type === 'INTERNSHIP_MID') {
    title = 'Mid Internship Review';
  } else if (row.review_type === 'INTERNSHIP_FINAL') {
    title = 'Final Internship Review';
  }

  return {
    id: row.id,
    code: row.code || undefined,
    title,
    activity_id: row.activity_id || row.activityId || activity.id || '',
    activity_title: activityTitle,
    activity_type: activityType,
    review_type: (row.review_type || row.reviewType || 'PROJECT_WEEKLY') as ApiReviewType,
    review_number: Number(row.review_number || row.reviewNumber || 1),
    date: row.date,
    time: row.time,
    venue: row.venue,
    status: row.status as ApiReviewSessionStatus,
    faculty_reviewer: row.faculty_reviewer || row.facultyReviewer || undefined,
    student_team,
    progress: progressReports[0] || undefined,
    progress_reports: progressReports.length > 0 ? progressReports : undefined,
    attendance,
    meeting_notes: row.meeting_notes || row.meetingNotes || undefined,
    next_week_goal: row.next_week_goal || row.nextWeekGoal || undefined,
    qr_code_token: row.qr_token || row.qrToken || row.qr_code_token || undefined,
    qr_token: row.qr_token || row.qrToken || undefined,
    qr_expires_at: row.qr_expires_at || row.qrExpiresAt || undefined,
    created_at: row.created_at || row.createdAt || new Date().toISOString(),
  } as ApiReviewSession & Record<string, unknown>;
}

/**
 * Serializes Weekly Progress to strict snake_case wire format.
 */
export function serializeWeeklyProgress(row: Record<string, any>): ApiWeeklyProgress {
  return {
    id: row.id,
    review_session_id: row.review_session_id || row.reviewSessionId || '',
    student_id: row.student_id || row.studentId || '',
    completed_this_week: row.completed_this_week || row.completedWork || '',
    currently_working_on: row.currently_working_on || row.currentWork || '',
    next_week_goal: row.next_week_goal || row.nextSteps || '',
    blockers: row.blockers || '',
    github_url: row.github_url || row.githubUrl || undefined,
    submitted_at: row.submitted_at || row.submittedAt || new Date().toISOString(),
  };
}

/**
 * Serializes a student record to strict snake_case wire format.
 */
export function serializeStudentRecord(
  row: Record<string, any>
): ApiStudentRecord & Record<string, unknown> {
  const users = row.users || {};
  return {
    id: row.id,
    user_id: row.user_id || row.userId || '',
    register_number: row.register_number || row.registerNumber || row.regNo || '',
    name: row.name || '',
    department: row.department || 'CSE',
    year: row.year || 'I',
    section: row.section || 'A',
    email: row.email || users.email || '',
    created_at: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

/**
 * Serializes a department event to strict snake_case wire format.
 */
export function serializeEvent(
  row: Record<string, any>,
  extra?: { attached_ods?: any[]; attachedODs?: any[] }
): Record<string, unknown> {
  const attachedRaw =
    extra?.attached_ods || extra?.attachedODs || row.attached_ods || row.attachedODs || [];

  return {
    id: row.id,
    code: row.code,
    title: row.title,
    purpose: row.purpose,
    date: row.date,
    end_date: row.end_date || row.endDate || row.date,
    venue: row.venue,
    city: row.city || '',
    status: row.status,
    created_at: row.created_at || row.createdAt || new Date().toISOString(),
    ...(attachedRaw.length > 0
      ? {
          attached_ods: attachedRaw.map((o: any) => ({
            id: o.id,
            code: o.code,
            status: o.status,
            start_date: o.start_date || o.startDate,
            end_date: o.end_date || o.endDate,
          })),
        }
      : {}),
  };
}

/**
 * Serializes a document metadata row to strict snake_case wire format.
 */
export function serializeDocument(row: Record<string, any>): DocumentUploadResponse {
  return {
    id: row.id,
    file_name: row.file_name || row.fileName,
    document_type: row.document_type || row.documentType,
    storage_path: row.storage_path || row.storagePath,
    size: Number(row.size || 0),
    owner: row.owner,
    owner_id: row.owner_id || row.ownerId,
    uploaded_by: row.uploaded_by || row.uploadedBy,
    created_at: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

/**
 * Serializes signed URL result to strict snake_case wire format.
 */
export function serializeSignedUrl(
  row: Record<string, any>,
  signedUrl: string,
  expiresInSeconds: number = 900
): DocumentSignedUrlResponse {
  return {
    id: row.id,
    file_name: row.file_name || row.fileName,
    document_type: row.document_type || row.documentType,
    storage_path: row.storage_path || row.storagePath,
    size: Number(row.size || 0),
    signed_url: signedUrl,
    expires_in_seconds: expiresInSeconds,
    created_at: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

/**
 * Serializes an in-app notification to strict snake_case wire format.
 */
export function serializeNotification(row: Record<string, any>): ApiNotification {
  return {
    id: row.id,
    user_id: row.user_id || row.userId,
    title: row.title,
    message: row.message,
    type: row.type,
    is_read:
      row.is_read !== undefined
        ? row.is_read
        : row.isRead !== undefined
          ? row.isRead
          : false,
    link_url: row.link_url || row.linkUrl || undefined,
    created_at: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

/**
 * Serializes an OD conflict item to strict snake_case wire format.
 */
export function serializeODConflict(
  row: Record<string, any>,
  fallbackStudent?: { name?: string; register_number?: string }
): ApiODConflictItem & Record<string, unknown> {
  return {
    od_id: row.od_id || row.odId || row.id,
    code: row.code,
    event_name: row.event_name || row.eventName || '',
    purpose: row.purpose,
    start_date: row.start_date || row.startDate || '',
    end_date: row.end_date || row.endDate || '',
    status: row.status,
    conflict_type: row.conflict_type || row.conflictType || undefined,
    student_name:
      row.student_name ||
      row.studentName ||
      row.students?.name ||
      fallbackStudent?.name ||
      '',
    register_number:
      row.register_number ||
      row.registerNumber ||
      row.students?.register_number ||
      fallbackStudent?.register_number ||
      '',
  };
}

/**
 * Serializes departmental summary report to strict snake_case wire format.
 */
export function serializeReportSummary(row: Record<string, any>): Record<string, unknown> {
  const students = row.students || {};
  const odRequests = row.od_requests || row.odRequests || {};
  const activities = row.activities || {};
  const reviews = row.reviews || {};
  const events = row.events || {};

  return {
    department: row.department || 'Computer Science and Engineering',
    academic_year: row.academic_year || row.academicYear || '2026-2027',
    total_students: Number(
      row.total_students !== undefined
        ? row.total_students
        : row.totalStudents !== undefined
          ? row.totalStudents
          : students.total || 0
    ),
    active_ods: Number(
      row.active_ods !== undefined
        ? row.active_ods
        : row.activeODs !== undefined
          ? row.activeODs
          : odRequests.pending || odRequests.approved || 0
    ),
    total_activities: Number(
      row.total_activities !== undefined
        ? row.total_activities
        : row.totalActivities !== undefined
          ? row.totalActivities
          : activities.total || 0
    ),
    upcoming_reviews: Number(
      row.upcoming_reviews !== undefined
        ? row.upcoming_reviews
        : row.upcomingReviews !== undefined
          ? row.upcomingReviews
          : reviews.scheduled || 0
    ),
    students: {
      total: Number(students.total || 0),
      by_year: {
        I: Number(students.by_year?.I || students.byYear?.I || 0),
        II: Number(students.by_year?.II || students.byYear?.II || 0),
        III: Number(students.by_year?.III || students.byYear?.III || 0),
        IV: Number(students.by_year?.IV || students.byYear?.IV || 0),
      },
      by_section: {
        A: Number(students.by_section?.A || students.bySection?.A || 0),
        B: Number(students.by_section?.B || students.bySection?.B || 0),
        C: Number(students.by_section?.C || students.bySection?.C || 0),
        D: Number(students.by_section?.D || students.bySection?.D || 0),
        E: Number(students.by_section?.E || students.bySection?.E || 0),
      },
    },
    od_requests: {
      total: Number(odRequests.total || 0),
      pending: Number(odRequests.pending || 0),
      approved: Number(odRequests.approved || 0),
      rejected: Number(odRequests.rejected || 0),
      revision_requested: Number(
        odRequests.revision_requested !== undefined
          ? odRequests.revision_requested
          : odRequests.revisionRequested || 0
      ),
      total_approved_days: Number(
        odRequests.total_approved_days !== undefined
          ? odRequests.total_approved_days
          : odRequests.totalApprovedDays || 0
      ),
    },
    activities: {
      total: Number(activities.total || 0),
      projects: Number(activities.projects || 0),
      hackathons: Number(activities.hackathons || 0),
      internships: Number(activities.internships || 0),
      status_breakdown: {
        submitted: Number(
          activities.status_breakdown?.submitted ||
            activities.statusBreakdown?.submitted ||
            0
        ),
        active: Number(
          activities.status_breakdown?.active ||
            activities.statusBreakdown?.active ||
            0
        ),
        rejected: Number(
          activities.status_breakdown?.rejected ||
            activities.statusBreakdown?.rejected ||
            0
        ),
        revision_requested: Number(
          activities.status_breakdown?.revision_requested !== undefined
            ? activities.status_breakdown?.revision_requested
            : activities.statusBreakdown?.revisionRequested || 0
        ),
        completed: Number(
          activities.status_breakdown?.completed ||
            activities.statusBreakdown?.completed ||
            0
        ),
      },
    },
    reviews: {
      total: Number(reviews.total || 0),
      scheduled: Number(reviews.scheduled || 0),
      completed: Number(reviews.completed || 0),
      total_attended_count: Number(
        reviews.total_attended_count !== undefined
          ? reviews.total_attended_count
          : reviews.totalAttendedCount || 0
      ),
    },
    events: {
      total: Number(events.total || 0),
      upcoming: Number(events.upcoming || 0),
      ongoing: Number(events.ongoing || 0),
      completed: Number(events.completed || 0),
    },
  };
}
