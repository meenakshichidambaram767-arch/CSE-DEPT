/**
 * Weekly Review Engine API Client & Module (Phase 5)
 * SIET CSE Department Platform - API Contract v2.0
 *
 * Implements batch scheduling, 4-quadrant student progress, expiring QR check-in,
 * meeting notes, and session finalization. Enforces 100% non-evaluative review cycles (PRD §5.3).
 */

import { ReviewSession, WeeklyProgress, AttendanceItem } from '@/types';
import {
  ApiReviewSession,
  FinalizeReviewPayload,
  GenerateQrResponse,
  PaginatedResponse,
  ReviewCheckInPayload,
  ReviewProgressPayload,
} from '@/types/contract';
import { mapApiReviewToReviewSession } from './mappers';
import { ApiError, apiClient, areDevMocksEnabled } from './client';
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

export { ApiError };

// In-memory contract mock store initialized for isolated dev & unit test fallbacks
const defaultInitialStore: ReviewSessionContract[] = [
  {
    id: 'rev-sess-001',
    activity_id: 'act-exam-monitor-01',
    activity_title: 'AI-Based Examination Monitoring System',
    activity_type: 'PROJECT',
    review_number: 1,
    review_type: 'PROJECT_WEEKLY',
    date: '2026-09-25',
    raw_date: '2026-09-25',
    time: '14:00',
    venue: 'CSE Lab 2',
    status: 'SCHEDULED',
    student_team: [
      { name: 'Meena C', reg_no: '714023104088', email: 'meena.23cse@siet.ac.in', role: 'Team Lead' },
    ],
    attendance: [
      {
        student_id: 'usr-student-001',
        name: 'Meena C',
        reg_no: '714023104088',
        attended: false,
      },
    ],
    created_at: '2026-09-20T10:00:00Z',
  },
  {
    id: 'rev-sess-002',
    activity_id: 'act-exam-monitor-01',
    activity_title: 'AI-Based Examination Monitoring System',
    activity_type: 'PROJECT',
    review_number: 2,
    review_type: 'PROJECT_WEEKLY',
    date: '2026-10-02',
    raw_date: '2026-10-02',
    time: '14:00',
    venue: 'CSE Lab 2',
    status: 'SCHEDULED',
    qr_code_token: 'HMAC_DYNAMIC_QR_TOKEN_002',
    student_team: [
      { name: 'Meena C', reg_no: '714023104088', email: 'meena.23cse@siet.ac.in', role: 'Team Lead' },
    ],
    attendance: [
      {
        student_id: 'usr-student-001',
        name: 'Meena C',
        reg_no: '714023104088',
        attended: false,
      },
    ],
    created_at: '2026-09-20T10:00:00Z',
  },
  {
    id: 'rev-002',
    activity_id: 'act-001',
    activity_title: 'AI-Based Examination Monitoring System',
    activity_type: 'PROJECT',
    review_number: 2,
    review_type: 'PROJECT_WEEKLY',
    date: '2026-10-09',
    raw_date: '2026-10-09',
    time: '14:00',
    venue: 'CSE Lab 2',
    status: 'SCHEDULED',
    student_team: [
      { name: 'Meena C', reg_no: '714023104088', email: 'meena.23cse@siet.ac.in', role: 'Team Lead' },
    ],
    attendance: [
      {
        student_id: 'usr-student-001',
        name: 'Meena C',
        reg_no: '714023104088',
        attended: false,
      },
    ],
    created_at: '2026-09-20T10:00:00Z',
  },
  {
    id: 'rev-003',
    activity_id: 'act-002',
    activity_title: 'Smart Water Management IoT',
    activity_type: 'PROJECT',
    review_number: 1,
    review_type: 'PROJECT_WEEKLY',
    date: '2026-09-25',
    raw_date: '2026-09-25',
    time: '10:00',
    venue: 'IoT Lab',
    status: 'COMPLETED',
    student_team: [
      { name: 'Nakshatra S V', reg_no: '714022104153', email: 'nakshatra.22cse@siet.ac.in', role: 'Team Lead' },
    ],
    attendance: [
      {
        student_id: 'usr-student-002',
        name: 'Nakshatra S V',
        reg_no: '714022104153',
        attended: true,
        check_in_time: '10:05 AM',
      },
    ],
    meeting_notes: 'Initial sensor calibration completed successfully.',
    next_week_goal: 'Integrate telemetry dashboard with Cloud MQTT broker.',
    finalized_at: '2026-09-25T11:00:00Z',
    created_at: '2026-09-18T10:00:00Z',
  },
];
let sessionStore: ReviewSessionContract[] = [...defaultInitialStore];

export interface ReviewSessionsQueryParams {
  activity_id?: string;
  status?: string;
  type?: string;
  page?: number;
  page_size?: number;
}

export interface ReviewCheckInResult {
  success: boolean;
  session_id?: string;
  student_id?: string;
  checked_in_at?: string;
  check_in_time?: string;
  register_number?: string;
  message?: string;
}

export const reviewsApi = {
  /**
   * Reset store to initial mock fixtures (for testing and isolation)
   */
  resetStore: (customSessions?: ReviewSession[]): void => {
    if (customSessions) {
      sessionStore = customSessions.map(mapReviewSessionToContract);
    } else {
      sessionStore = [...defaultInitialStore];
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
    const raw = await reviewsApi.getRawSessions({
      activity_id: filter?.activityId,
      status: filter?.status,
      type: filter?.type,
      page_size: 100,
    });
    return raw.data.map(mapApiReviewToReviewSession);
  },

  /**
   * GET /api/v1/reviews/sessions (Mapped to UI model)
   */
  async getSessions(
    params?: ReviewSessionsQueryParams
  ): Promise<PaginatedResponse<ReviewSession>> {
    const raw = await this.getRawSessions(params);
    return {
      data: raw.data.map(mapApiReviewToReviewSession),
      meta: raw.meta,
    };
  },

  /**
   * GET /api/v1/reviews/sessions (Raw Contract format)
   */
  async getRawSessions(
    params?: ReviewSessionsQueryParams
  ): Promise<PaginatedResponse<ApiReviewSession>> {
    const res = await apiClient.get<PaginatedResponse<ApiReviewSession>>('/api/v1/reviews/sessions', {
      params: {
        ...(params?.activity_id ? { activity_id: params.activity_id } : {}),
        ...(params?.status && params.status !== 'ALL' ? { status: params.status } : {}),
        ...(params?.type && params.type !== 'ALL' ? { type: params.type } : {}),
        page: params?.page || 1,
        page_size: params?.page_size || 20,
      },
      fallback: () => {
        let filtered = [...sessionStore];
        if (params?.activity_id) {
          filtered = filtered.filter((r) => r.activity_id === params.activity_id);
        }
        if (params?.status && params.status !== 'ALL') {
          filtered = filtered.filter((r) => r.status === params.status);
        }
        if (params?.type && params.type !== 'ALL') {
          filtered = filtered.filter((r) => r.review_type === params.type);
        }
        const page = params?.page || 1;
        const pageSize = params?.page_size || 20;
        const startIndex = (page - 1) * pageSize;
        const paginated = filtered.slice(startIndex, startIndex + pageSize);

        return {
          data: paginated as unknown as ApiReviewSession[],
          meta: {
            page,
            page_size: pageSize,
            total: filtered.length,
          },
        };
      },
    });

    return res;
  },

  /**
   * Compatibility alias for getSessions
   */
  async getReviewSessions(
    params?: ReviewSessionsQueryParams
  ): Promise<PaginatedResponse<ReviewSession>> {
    return this.getSessions(params);
  },

  /**
   * Prototype fallback helper to get local mock reviews
   */
  getFallbackReviewSessions(): ReviewSession[] {
    return sessionStore.map(mapContractToReviewSession);
  },

  /**
   * GET /api/v1/reviews/sessions/{id}
   */
  getById: async (id: string): Promise<ReviewSession | undefined> => {
    try {
      const res = await apiClient.get<ApiReviewSession>(
        `/api/v1/reviews/sessions/${encodeURIComponent(id)}`,
        {
          fallback: () => {
            const found = sessionStore.find((r) => r.id === id);
            if (!found) {
              throw new ApiError(404, 'SESSION_NOT_FOUND', `Review session ${id} not found`);
            }
            return found as unknown as ApiReviewSession;
          },
        }
      );
      return mapApiReviewToReviewSession(res);
    } catch {
      return undefined;
    }
  },

  /**
   * GET /api/v1/reviews/sessions/{id} (Object wrapped)
   */
  async getSessionById(id: string): Promise<{ data: ReviewSession }> {
    const session = await this.getById(id);
    if (!session) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', `Review session ${id} not found`);
    }
    return { data: session };
  },

  /**
   * POST /api/v1/reviews/schedule
   */
  schedule: async (
    payload: ScheduleReviewContractPayload,
    teamRoster?: Array<{ name: string; reg_no?: string; regNo?: string; email: string; role?: string }>
  ): Promise<ReviewSession[]> => {
    if (!payload.activity_id) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'activity_id is required', {
        activity_id: 'Cannot be empty',
      });
    }

    const scheduledDate = payload.scheduled_date || payload.start_date;
    if (!scheduledDate) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'scheduled_date is required', {
        scheduled_date: 'Must be a valid date YYYY-MM-DD',
      });
    }

    const count = payload.total_reviews || payload.count || (payload.review_type === 'HACKATHON_POST' ? 1 : payload.review_type.startsWith('INTERNSHIP') ? 2 : 8);

    if (payload.review_type === 'HACKATHON_POST' && count !== 1) {
      throw new ApiError(
        400,
        'INVALID_SCHEDULING_RULE',
        'Hackathons support exactly one post-hackathon review (HACKATHON_POST)'
      );
    }

    const res = await apiClient.post<ApiReviewSession[]>('/api/v1/reviews/schedule', payload, {
      fallback: () => {
        const createdContracts: ReviewSessionContract[] = [];
        const baseDate = new Date(scheduledDate);

        for (let i = 1; i <= count; i++) {
          const sessionDate = new Date(baseDate);
          sessionDate.setDate(baseDate.getDate() + (i - 1) * 7);
          const dateStr = sessionDate.toISOString().split('T')[0];

          let sessionType = payload.review_type;
          if (payload.review_type === 'INTERNSHIP_MID' && i === 2) {
            sessionType = 'INTERNSHIP_FINAL';
          }

          const newId = `rev-${payload.activity_id}-${i}-${Date.now().toString(36)}`;
          const initialAttendance = (teamRoster || [
            { name: 'Meena C', reg_no: '714023104088', email: 'meena.23cse@siet.ac.in', role: 'Team Lead' },
          ]).map((member) => ({
            student_id: `std-${member.reg_no || member.regNo || 'unknown'}`,
            name: member.name,
            reg_no: member.reg_no || member.regNo || '',
            attended: false,
          }));

          const contract: ReviewSessionContract = {
            id: newId,
            activity_id: payload.activity_id,
            activity_title: payload.activity_title || 'Review Session',
            activity_type: payload.review_type.startsWith('PROJECT') ? 'PROJECT' : payload.review_type.startsWith('HACKATHON') ? 'HACKATHON' : 'INTERNSHIP',
            review_number: i,
            review_type: sessionType,
            date: dateStr,
            raw_date: dateStr,
            time: payload.time || '10:00 AM',
            venue: payload.venue || 'CSE Department',
            status: 'SCHEDULED',
            student_team: (teamRoster || [
              { name: 'Meena C', reg_no: '714023104088', email: 'meena.23cse@siet.ac.in', role: 'Team Lead' },
            ]).map((t) => ({
              name: t.name,
              reg_no: t.reg_no || t.regNo || '',
              email: t.email,
              role: t.role,
            })),
            attendance: initialAttendance,
            created_at: new Date().toISOString(),
          };

          createdContracts.push(contract);
          sessionStore.push(contract);
        }

        return createdContracts as unknown as ApiReviewSession[];
      },
    });

    const list = Array.isArray(res) ? res : ((res as any).data || []);
    return list.map(mapApiReviewToReviewSession);
  },

  /**
   * Alias for schedule
   */
  async scheduleReviews(
    payload: ScheduleReviewContractPayload,
    teamRoster?: Array<{ name: string; reg_no?: string; regNo?: string; email: string; role?: string }>
  ): Promise<ReviewSession[]> {
    return this.schedule(payload, teamRoster);
  },

  /**
   * POST /api/v1/reviews/sessions/{id}/progress
   */
  submitProgress: async (
    sessionId: string,
    req: ReviewProgressContract | ReviewProgressPayload | Partial<WeeklyProgress>
  ): Promise<WeeklyProgress & { data: { id: string; success: boolean }; success: boolean }> => {
    let contractReq: ReviewProgressContract;
    if ('completed_this_week' in req) {
      contractReq = req as ReviewProgressContract;
    } else {
      const p = req as any;
      contractReq = {
        completed_this_week: p.completedThisWeek || '',
        currently_working_on: p.currentlyWorkingOn || '',
        next_week_goal: p.nextWeekGoal || '',
        blockers: p.blockers || '',
        github_url: p.githubUrl,
      };
    }

    const validation = validateProgressContract(contractReq);
    if (!validation.isValid) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Validation failed for weekly progress payload', validation.errors);
    }

    const res = await apiClient.post<any>(
      `/api/v1/reviews/sessions/${encodeURIComponent(sessionId)}/progress`,
      contractReq,
      {
        fallback: () => {
          const sessionIndex = sessionStore.findIndex((s) => s.id === sessionId);
          if (sessionIndex === -1) {
            throw new ApiError(404, 'SESSION_NOT_FOUND', `Review session ${sessionId} not found`);
          }

          const progress = mapContractToProgress(contractReq, sessionId);
          sessionStore[sessionIndex] = {
            ...sessionStore[sessionIndex],
            progress: contractReq,
          };

          return Object.assign(progress, {
            data: { id: progress.id, success: true },
            success: true,
          });
        },
      }
    );

    const progress = mapContractToProgress(contractReq, sessionId);
    return Object.assign(progress, {
      data: {
        id: res?.id || progress.id,
        success: true,
      },
      success: true,
    });
  },

  /**
   * Compatibility alias for submitProgress
   */
  async submitWeeklyProgress(
    id: string,
    payload: ReviewProgressPayload | Partial<WeeklyProgress>
  ): Promise<{ data: { id: string; success: boolean }; success: boolean }> {
    return this.submitProgress(id, payload);
  },

  /**
   * POST /api/v1/reviews/sessions/{id}/generate-qr
   */
  generateQR: async (
    sessionId: string,
    expiresInSeconds: number = 1800
  ): Promise<GenerateQRResponse> => {
    return apiClient.post<GenerateQRResponse>(
      `/api/v1/reviews/sessions/${encodeURIComponent(sessionId)}/generate-qr`,
      { valid_seconds: expiresInSeconds },
      {
        fallback: () => {
          const sessionIndex = sessionStore.findIndex((s) => s.id === sessionId);
          if (sessionIndex === -1) {
            throw new ApiError(404, 'SESSION_NOT_FOUND', `Review session ${sessionId} not found`);
          }

          const session = sessionStore[sessionIndex];
          if (session.status === 'COMPLETED') {
            throw new ApiError(409, 'INVALID_TRANSITION', 'Cannot generate QR code for completed review session');
          }
          if (session.status === 'CANCELLED') {
            throw new ApiError(409, 'INVALID_TRANSITION', 'Cannot generate QR code for cancelled review session');
          }

          const now = Date.now();
          const expiresAt = new Date(now + expiresInSeconds * 1000).toISOString();
          const token = `QR-${sessionId}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

          sessionStore[sessionIndex] = {
            ...session,
            qr_code_token: token,
            qr_expires_at: expiresAt,
            qr_valid_seconds: expiresInSeconds,
          };

          return {
            session_id: sessionId,
            token,
            expires_at: expiresAt,
            valid_seconds: expiresInSeconds,
            generated_at: new Date(now).toISOString(),
          };
        },
      }
    );
  },

  /**
   * Compatibility alias for generateQR
   */
  async generateQr(id: string): Promise<{ data: GenerateQrResponse }> {
    const res = await this.generateQR(id);
    return { data: res };
  },

  /**
   * POST /api/v1/reviews/sessions/{id}/check-in
   */
  checkInQR: async (
    sessionId: string,
    req: CheckInQRRequest
  ): Promise<CheckInQRResponse & { data: ReviewCheckInResult }> => {
    if (!req.token || req.token.trim().length === 0) {
      throw new ApiError(400, 'INVALID_TOKEN', 'QR token is required');
    }

    const res = await apiClient.post<any>(
      `/api/v1/reviews/sessions/${encodeURIComponent(sessionId)}/check-in`,
      req,
      {
        fallback: () => {
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

          const checkedInAt = new Date().toISOString();
          return {
            success: true,
            session_id: sessionId,
            student_id: req.student_id,
            checked_in_at: checkedInAt,
            message: 'Attendance verified successfully via QR code.',
            data: {
              success: true,
              session_id: sessionId,
              student_id: req.student_id,
              checked_in_at: checkedInAt,
              message: 'Attendance check-in verified successfully.',
            },
          };
        },
      }
    );

    return {
      success: res?.success ?? true,
      session_id: res?.session_id ?? sessionId,
      student_id: res?.student_id ?? req.student_id,
      checked_in_at: res?.checked_in_at ?? new Date().toISOString(),
      message: res?.message ?? 'Attendance check-in verified successfully.',
      data: {
        success: res?.success ?? true,
        session_id: res?.session_id ?? sessionId,
        student_id: res?.student_id ?? req.student_id,
        checked_in_at: res?.checked_in_at ?? new Date().toISOString(),
        message: res?.message ?? 'Attendance check-in verified successfully.',
      },
    };
  },

  /**
   * Flexible checkIn method supporting string token or ReviewCheckInPayload
   */
  async checkIn(
    id: string,
    payload: ReviewCheckInPayload | string
  ): Promise<{ data: ReviewCheckInResult } & CheckInQRResponse> {
    const token = typeof payload === 'string' ? payload : payload.token;
    const studentId = typeof payload === 'string' ? 'usr-student-001' : (payload as any).student_id || 'usr-student-001';

    return this.checkInQR(id, {
      token,
      student_id: studentId,
      student_name: 'Student',
    });
  },

  /**
   * Compatibility alias for checkIn
   */
  async checkInWithQR(
    id: string,
    token: string
  ): Promise<{ data: ReviewCheckInResult }> {
    return this.checkIn(id, token);
  },

  /**
   * PUT /api/v1/reviews/sessions/{id}/attendance
   */
  recordAttendance: async (
    sessionId: string,
    attendance: AttendanceItem[]
  ): Promise<AttendanceItem[]> => {
    await apiClient.put(
      `/api/v1/reviews/sessions/${encodeURIComponent(sessionId)}/attendance`,
      { attendance },
      {
        fallback: () => {
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
      }
    );

    return attendance;
  },

  /**
   * PUT /api/v1/reviews/sessions/{id}/notes
   */
  saveMeetingNotes: async (
    sessionId: string,
    notes: { meeting_notes: string; next_week_goal?: string }
  ): Promise<{ meetingNotes: string; nextWeekGoal?: string }> => {
    const res = await apiClient.put<any>(
      `/api/v1/reviews/sessions/${encodeURIComponent(sessionId)}/notes`,
      notes,
      {
        fallback: () => {
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
      }
    );

    return {
      meetingNotes: res?.meeting_notes || res?.meetingNotes || notes.meeting_notes,
      nextWeekGoal: res?.next_week_goal || res?.nextWeekGoal || notes.next_week_goal,
    };
  },

  /**
   * POST /api/v1/reviews/sessions/{id}/finalize
   */
  finalizeReview: async (
    sessionId: string,
    payload?: FinalizeReviewRequest
  ): Promise<FinalizeReviewResponse & { data: { success: boolean; session_id: string } }> => {
    const res = await apiClient.post<any>(
      `/api/v1/reviews/sessions/${encodeURIComponent(sessionId)}/finalize`,
      payload,
      {
        fallback: () => {
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

          const result: FinalizeReviewResponse = {
            session_id: sessionId,
            status: 'COMPLETED',
            finalized_at: finalizedAt,
            meeting_notes: payload?.meeting_notes || session.meeting_notes,
            next_week_goal: payload?.next_week_goal || session.next_week_goal,
          };

          return {
            ...result,
            data: { success: true, session_id: sessionId },
          };
        },
      }
    );

    return {
      session_id: res?.session_id || sessionId,
      status: 'COMPLETED',
      finalized_at: res?.finalized_at || new Date().toISOString(),
      meeting_notes: res?.meeting_notes || payload?.meeting_notes,
      next_week_goal: res?.next_week_goal || payload?.next_week_goal,
      data: {
        success: true,
        session_id: res?.session_id || sessionId,
      },
    };
  },

  /**
   * Alias for finalizeSession
   */
  async finalizeSession(
    id: string,
    payload: FinalizeReviewPayload
  ): Promise<{ data: { success: boolean; session_id: string } }> {
    return this.finalizeReview(id, {
      meeting_notes: payload.meeting_notes,
      next_week_goal: payload.next_week_goal,
    });
  },

  /**
   * POST /api/v1/reviews/sessions/{id}/cancel
   */
  cancelReview: async (sessionId: string): Promise<ReviewSession> => {
    const res = await apiClient.post<any>(
      `/api/v1/reviews/sessions/${encodeURIComponent(sessionId)}/cancel`,
      undefined,
      {
        fallback: () => {
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
      }
    );

    const mapped = res?.data ? mapApiReviewToReviewSession(res.data) : (res?.id ? mapApiReviewToReviewSession(res) : undefined);
    if (mapped) return mapped;
    const found = sessionStore.find((s) => s.id === sessionId);
    return mapContractToReviewSession(found!);
  },

  /**
   * Aliases for DataContext and component consumers
   */
  async cancelSession(sessionId: string, _reason?: string): Promise<ReviewSession> {
    return this.cancelReview(sessionId);
  },

  async updateAttendance(sessionId: string, attendance: AttendanceItem[]): Promise<AttendanceItem[]> {
    return this.recordAttendance(sessionId, attendance);
  },

  async updateNotes(
    sessionId: string,
    notes: { meetingNotes?: string; nextWeekGoal?: string } | { meeting_notes: string; next_week_goal?: string }
  ): Promise<{ meetingNotes: string; nextWeekGoal?: string }> {
    return this.saveMeetingNotes(
      sessionId,
      'meeting_notes' in notes
        ? notes
        : {
            meeting_notes: notes.meetingNotes || '',
            next_week_goal: notes.nextWeekGoal,
          }
    );
  },
};

export default reviewsApi;
