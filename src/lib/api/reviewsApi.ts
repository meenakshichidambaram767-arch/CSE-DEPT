/**
 * API Contract v2.0 - Reviews API Module
 * Implements endpoints according to SIET CSE API Contract v2.0
 * Strictly non-evaluative, offline mock resolver (NO live backend/Supabase/Nattu requests)
 */

import { ReviewSession, WeeklyProgress, AttendanceItem } from '@/types';
import { mockReviewSessions } from '@/data/mock';
import { ApiError, assertNoLiveNetwork } from './client';
import {
  ReviewType,
  ReviewSessionStatus,
  ReviewProgressContract,
  ScheduleReviewContractPayload,
  GenerateQRResponse,
  CheckInQRRequest,
  CheckInQRResponse,
  FinalizeReviewRequest,
  FinalizeReviewResponse,
  ReviewSessionContract,
  validateProgressContract,
  mapContractToProgress,
  mapContractToReviewSession,
  mapReviewSessionToContract,
} from './contractTypes';

// In-memory contract mock store initialized from fixtures
let sessionStore: ReviewSessionContract[] = mockReviewSessions.map(mapReviewSessionToContract);

export const reviewsApi = {
  /**
   * Reset store to initial mock fixtures (for testing and isolation)
   */
  resetStore: (customSessions?: ReviewSession[]): void => {
    if (customSessions) {
      sessionStore = customSessions.map(mapReviewSessionToContract);
    } else {
      sessionStore = mockReviewSessions.map(mapReviewSessionToContract);
    }
  },

  /**
   * GET /api/v1/reviews/sessions
   */
  getAll: async (filter?: {
    activityId?: string;
    status?: ReviewSessionStatus;
    type?: ReviewType;
  }): Promise<ReviewSession[]> => {
    assertNoLiveNetwork();
    let results = [...sessionStore];
    if (filter?.activityId) {
      results = results.filter((s) => s.activity_id === filter.activityId);
    }
    if (filter?.status) {
      results = results.filter((s) => s.status === filter.status);
    }
    if (filter?.type) {
      results = results.filter((s) => s.review_type === filter.type);
    }
    return results.map(mapContractToReviewSession);
  },

  /**
   * GET /api/v1/reviews/sessions/{id}
   */
  getById: async (id: string): Promise<ReviewSession | undefined> => {
    assertNoLiveNetwork();
    const found = sessionStore.find((r) => r.id === id);
    return found ? mapContractToReviewSession(found) : undefined;
  },

  /**
   * POST /api/v1/reviews/schedule
   */
  schedule: async (
    payload: ScheduleReviewContractPayload,
    teamRoster?: Array<{ name: string; reg_no?: string; regNo?: string; email: string; role?: string }>
  ): Promise<ReviewSession[]> => {
    assertNoLiveNetwork();

    if (!payload.activity_id) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'activity_id is required', {
        activity_id: 'Cannot be empty',
      });
    }

    if (!payload.scheduled_date) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'scheduled_date is required', {
        scheduled_date: 'Must be a valid date YYYY-MM-DD',
      });
    }

    // Business rules validation according to backend API Contract v2.0
    // PROJECT: weekly reviews
    // HACKATHON: exactly one post-hackathon review
    // INTERNSHIP: exactly two reviews (INTERNSHIP_MID and INTERNSHIP_FINAL)
    const count = payload.total_reviews || (payload.review_type === 'HACKATHON_POST' ? 1 : payload.review_type.startsWith('INTERNSHIP') ? 2 : 8);

    if (payload.review_type === 'HACKATHON_POST' && count !== 1) {
      throw new ApiError(
        400,
        'INVALID_SCHEDULING_RULE',
        'Hackathons support exactly one post-hackathon review (HACKATHON_POST)'
      );
    }

    const createdContracts: ReviewSessionContract[] = [];
    const baseDate = new Date(payload.scheduled_date);
    const stepWeeks = payload.interval_weeks || 1;

    const roster = teamRoster && teamRoster.length > 0
      ? teamRoster.map((m) => ({
          name: m.name,
          reg_no: m.reg_no || m.regNo || '714023104088',
          email: m.email,
          role: m.role,
        }))
      : [
          { name: 'Meena C', reg_no: '714023104088', email: 'meena.23cse@siet.ac.in', role: 'Team Lead' },
        ];

    if (payload.review_type === 'INTERNSHIP_MID' || payload.review_type === 'INTERNSHIP_FINAL') {
      // Create mid and/or final
      const types: ReviewType[] = count === 1 ? [payload.review_type] : ['INTERNSHIP_MID', 'INTERNSHIP_FINAL'];
      types.forEach((rType, idx) => {
        const revDate = new Date(baseDate);
        revDate.setDate(baseDate.getDate() + idx * 30);
        const rawDateStr = revDate.toISOString().split('T')[0];
        const formattedDate = revDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });
        const sessionId = `REV-INT-${payload.activity_id.replace(/\D/g, '') || Date.now()}-${idx + 1}`;

        const item: ReviewSessionContract = {
          id: sessionId,
          activity_id: payload.activity_id,
          activity_title: payload.activity_title || 'Internship Milestone',
          activity_type: 'INTERNSHIP',
          review_number: idx + 1,
          review_type: rType,
          date: formattedDate,
          raw_date: rawDateStr,
          time: payload.time || '11:00 AM',
          venue: payload.venue || 'HOD Office',
          status: 'SCHEDULED',
          student_team: roster,
          attendance: roster.map((m) => ({
            student_id: `usr-${m.reg_no}`,
            name: m.name,
            reg_no: m.reg_no,
            attended: false,
          })),
          created_at: new Date().toISOString(),
        };
        createdContracts.push(item);
      });
    } else {
      for (let i = 1; i <= count; i++) {
        const revDate = new Date(baseDate);
        revDate.setDate(baseDate.getDate() + (i - 1) * 7 * stepWeeks);
        const rawDateStr = revDate.toISOString().split('T')[0];
        const formattedDate = revDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });
        const prefix = payload.review_type === 'HACKATHON_POST' ? 'REV-HCK' : 'REV-PRJ';
        const sessionId = `${prefix}-${payload.activity_id.replace(/\D/g, '') || Date.now()}-${String(i).padStart(3, '0')}`;

        const item: ReviewSessionContract = {
          id: sessionId,
          activity_id: payload.activity_id,
          activity_title: payload.activity_title || 'Project Milestone',
          activity_type: payload.review_type === 'HACKATHON_POST' ? 'HACKATHON' : 'PROJECT',
          review_number: i,
          review_type: payload.review_type,
          date: formattedDate,
          raw_date: rawDateStr,
          time: payload.time || '2:00 PM',
          venue: payload.venue || 'CSE Lab 2',
          status: 'SCHEDULED',
          student_team: roster,
          attendance: roster.map((m) => ({
            student_id: `usr-${m.reg_no}`,
            name: m.name,
            reg_no: m.reg_no,
            attended: false,
          })),
          created_at: new Date().toISOString(),
        };
        createdContracts.push(item);
      }
    }

    sessionStore = [...createdContracts, ...sessionStore];
    return createdContracts.map(mapContractToReviewSession);
  },

  /**
   * POST /api/v1/reviews/sessions/{id}/progress
   */
  submitProgress: async (
    sessionId: string,
    progress: ReviewProgressContract
  ): Promise<WeeklyProgress> => {
    assertNoLiveNetwork();

    const validation = validateProgressContract(progress);
    if (!validation.isValid) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Progress validation failed', validation.errors);
    }

    const sessionIndex = sessionStore.findIndex((s) => s.id === sessionId);
    if (sessionIndex === -1) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', `Review session ${sessionId} not found`);
    }

    const session = sessionStore[sessionIndex];
    if (session.status === 'CANCELLED') {
      throw new ApiError(409, 'INVALID_TRANSITION', 'Cannot submit progress for a cancelled review session');
    }

    const progressWithMeta: ReviewProgressContract = {
      ...progress,
      submitted_at: new Date().toISOString(),
    };

    sessionStore[sessionIndex] = {
      ...session,
      progress: progressWithMeta,
    };

    return mapContractToProgress(progressWithMeta, sessionId);
  },

  /**
   * POST /api/v1/reviews/sessions/{id}/generate-qr
   */
  generateQR: async (sessionId: string, customValidSeconds?: number): Promise<GenerateQRResponse> => {
    assertNoLiveNetwork();

    const sessionIndex = sessionStore.findIndex((s) => s.id === sessionId);
    if (sessionIndex === -1) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', `Review session ${sessionId} not found`);
    }

    const session = sessionStore[sessionIndex];
    if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
      throw new ApiError(
        409,
        'INVALID_STATE',
        `Cannot generate QR for review session with status ${session.status}`
      );
    }

    const now = new Date();
    const validSeconds = customValidSeconds !== undefined ? customValidSeconds : 1800; // default 30 minutes validity
    const expiresAt = new Date(now.getTime() + validSeconds * 1000).toISOString();
    const token = `QR-${sessionId}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    sessionStore[sessionIndex] = {
      ...session,
      qr_code_token: token,
      qr_expires_at: expiresAt,
      qr_valid_seconds: validSeconds,
    };

    return {
      token,
      expires_at: expiresAt,
      valid_seconds: validSeconds,
      session_id: sessionId,
      generated_at: now.toISOString(),
    };
  },

  /**
   * POST /api/v1/reviews/sessions/{id}/check-in
   */
  checkInQR: async (
    sessionId: string,
    req: CheckInQRRequest
  ): Promise<CheckInQRResponse> => {
    assertNoLiveNetwork();

    if (!req.token || req.token.trim().length === 0) {
      throw new ApiError(400, 'INVALID_TOKEN', 'QR token is required');
    }

    const sessionIndex = sessionStore.findIndex((s) => s.id === sessionId);
    if (sessionIndex === -1) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', `Review session ${sessionId} not found`);
    }

    const session = sessionStore[sessionIndex];

    if (!session.qr_code_token || session.qr_code_token.trim() !== req.token.trim()) {
      throw new ApiError(400, 'INVALID_TOKEN', 'The provided QR token does not match the active session');
    }

    if (session.qr_expires_at) {
      const expiry = new Date(session.qr_expires_at);
      if (expiry.getTime() < Date.now()) {
        throw new ApiError(410, 'TOKEN_EXPIRED', 'The QR code token has expired. Please request a new QR from HOD.');
      }
    }

    // Check attendance
    const studentIdMatch = req.student_id;
    const studentRegMatch = req.student_reg_no;

    const existingAtt = session.attendance.find(
      (a) =>
        a.student_id === studentIdMatch ||
        (studentRegMatch && a.reg_no === studentRegMatch) ||
        (req.student_name && a.name.toLowerCase().includes(req.student_name.toLowerCase()))
    );

    if (existingAtt && existingAtt.attended) {
      throw new ApiError(409, 'ALREADY_CHECKED_IN', 'Student has already checked in for this review session');
    }

    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedAttendance = session.attendance.map((att) => {
      if (
        att.student_id === studentIdMatch ||
        (studentRegMatch && att.reg_no === studentRegMatch) ||
        (req.student_name && att.name.toLowerCase().includes(req.student_name.toLowerCase()))
      ) {
        return {
          ...att,
          attended: true,
          check_in_time: nowTimeStr,
        };
      }
      return att;
    });

    // If student was not previously in the attendance roster, add them
    if (!existingAtt) {
      updatedAttendance.push({
        student_id: req.student_id,
        name: req.student_name || 'Checked-in Student',
        reg_no: req.student_reg_no || '714023104088',
        attended: true,
        check_in_time: nowTimeStr,
      });
    }

    sessionStore[sessionIndex] = {
      ...session,
      attendance: updatedAttendance,
    };

    return {
      success: true,
      session_id: sessionId,
      student_id: req.student_id,
      checked_in_at: new Date().toISOString(),
      message: 'Attendance verified successfully via QR code.',
    };
  },

  /**
   * PUT /api/v1/reviews/sessions/{id}/attendance
   */
  recordAttendance: async (
    sessionId: string,
    attendance: AttendanceItem[]
  ): Promise<AttendanceItem[]> => {
    assertNoLiveNetwork();

    const sessionIndex = sessionStore.findIndex((s) => s.id === sessionId);
    if (sessionIndex === -1) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', `Review session ${sessionId} not found`);
    }

    const contractAttendance = attendance.map((a) => ({
      student_id: a.studentId,
      name: a.name,
      reg_no: a.regNo,
      attended: a.attended,
      check_in_time: a.checkInTime || (a.attended ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined),
    }));

    sessionStore[sessionIndex] = {
      ...sessionStore[sessionIndex],
      attendance: contractAttendance,
    };

    return attendance;
  },

  /**
   * PUT /api/v1/reviews/sessions/{id}/notes
   */
  saveMeetingNotes: async (
    sessionId: string,
    notes: { meeting_notes: string; next_week_goal?: string }
  ): Promise<{ meetingNotes: string; nextWeekGoal?: string }> => {
    assertNoLiveNetwork();

    const sessionIndex = sessionStore.findIndex((s) => s.id === sessionId);
    if (sessionIndex === -1) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', `Review session ${sessionId} not found`);
    }

    sessionStore[sessionIndex] = {
      ...sessionStore[sessionIndex],
      meeting_notes: notes.meeting_notes,
      next_week_goal: notes.next_week_goal || sessionStore[sessionIndex].next_week_goal,
    };

    return {
      meetingNotes: notes.meeting_notes,
      nextWeekGoal: notes.next_week_goal,
    };
  },

  /**
   * POST /api/v1/reviews/sessions/{id}/finalize
   */
  finalizeReview: async (
    sessionId: string,
    payload?: FinalizeReviewRequest
  ): Promise<FinalizeReviewResponse> => {
    assertNoLiveNetwork();

    const sessionIndex = sessionStore.findIndex((s) => s.id === sessionId);
    if (sessionIndex === -1) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', `Review session ${sessionId} not found`);
    }

    const session = sessionStore[sessionIndex];
    if (session.status === 'COMPLETED') {
      throw new ApiError(409, 'ALREADY_FINALIZED', 'This review session has already been finalized');
    }

    if (session.status === 'CANCELLED') {
      throw new ApiError(409, 'INVALID_TRANSITION', 'Cannot finalize a cancelled review session');
    }

    const finalizedAt = new Date().toISOString();

    sessionStore[sessionIndex] = {
      ...session,
      status: 'COMPLETED',
      meeting_notes: payload?.meeting_notes || session.meeting_notes,
      next_week_goal: payload?.next_week_goal || session.next_week_goal,
      finalized_at: finalizedAt,
    };

    return {
      session_id: sessionId,
      status: 'COMPLETED',
      finalized_at: finalizedAt,
      meeting_notes: payload?.meeting_notes || session.meeting_notes,
      next_week_goal: payload?.next_week_goal || session.next_week_goal,
    };
  },

  /**
   * POST /api/v1/reviews/sessions/{id}/cancel
   */
  cancelReview: async (sessionId: string): Promise<ReviewSession> => {
    assertNoLiveNetwork();

    const sessionIndex = sessionStore.findIndex((s) => s.id === sessionId);
    if (sessionIndex === -1) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', `Review session ${sessionId} not found`);
    }

    const session = sessionStore[sessionIndex];
    if (session.status === 'COMPLETED') {
      throw new ApiError(409, 'INVALID_TRANSITION', 'Cannot cancel an already completed review session');
    }

    sessionStore[sessionIndex] = {
      ...session,
      status: 'CANCELLED',
    };

    return mapContractToReviewSession(sessionStore[sessionIndex]);
  },
};
