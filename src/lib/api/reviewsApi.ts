import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { ApiError } from './odApi';
import { ReviewSession, ApiErrorEnvelope, PaginatedResponse } from '@/types';
import { mockReviewSessions } from '@/data/mock';

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const supabase = createSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch {
    // Suppress token lookup errors
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorCode = res.status === 404 ? 'BACKEND_DEPENDENCY_UNAVAILABLE' : 'UNKNOWN_ERROR';
    let errorMessage =
      res.status === 404
        ? `Backend endpoint ${res.url} is not yet available (HTTP 404).`
        : `HTTP ${res.status}: ${res.statusText}`;
    let details: Record<string, unknown> | undefined;

    try {
      const body = (await res.json()) as ApiErrorEnvelope;
      if (body?.error) {
        errorCode = body.error.code || errorCode;
        errorMessage = body.error.message || errorMessage;
        details = body.error.details;
      }
    } catch {
      // Non-JSON response payload
    }

    throw new ApiError(errorCode, errorMessage, res.status, details);
  }

  return res.json();
}

export interface ReviewSessionsQueryParams {
  activity_id?: string;
  status?: string;
  type?: string;
  page?: number;
  page_size?: number;
}

export interface WeeklyProgressPayload {
  completed_this_week: string;
  currently_working_on: string;
  next_week_goal: string;
  blockers: string;
  github_url?: string;
}

export interface WeeklyProgressResult {
  id: string;
  reviewSessionId: string;
  studentId: string;
  completedWork: string;
  currentWork: string;
  nextSteps: string;
  blockers: string;
  githubUrl?: string;
  submittedAt: string;
}

export interface CheckInResult {
  sessionId: string;
  studentId: string;
  studentName: string;
  attended: boolean;
  checkInTime: string;
  message: string;
}

export const reviewsApi = {
  /**
   * GET /api/v1/reviews/sessions
   * Fetches student's scheduled weekly review sessions
   */
  getReviewSessions: async (
    params?: ReviewSessionsQueryParams
  ): Promise<PaginatedResponse<ReviewSession>> => {
    const headers = await getAuthHeaders();
    const searchParams = new URLSearchParams();
    if (params?.activity_id) searchParams.set('activity_id', params.activity_id);
    if (params?.status && params.status !== 'ALL') searchParams.set('status', params.status);
    if (params?.type && params.type !== 'ALL') searchParams.set('type', params.type);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.page_size) searchParams.set('page_size', String(params.page_size));

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await fetch(`/api/v1/reviews/sessions${query}`, { headers });
    return handleResponse<PaginatedResponse<ReviewSession>>(res);
  },

  /**
   * GET /api/v1/reviews/sessions/[id]
   * Fetches single review session detail with progress log and attendance history
   */
  getReviewSessionById: async (id: string): Promise<{ data: ReviewSession }> => {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/v1/reviews/sessions/${encodeURIComponent(id)}`, { headers });
    return handleResponse<{ data: ReviewSession }>(res);
  },

  /**
   * POST /api/v1/reviews/sessions/[id]/progress
   * Submits or updates weekly progress report for a scheduled review session
   */
  submitWeeklyProgress: async (
    sessionId: string,
    payload: WeeklyProgressPayload
  ): Promise<{ data: WeeklyProgressResult }> => {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/v1/reviews/sessions/${encodeURIComponent(sessionId)}/progress`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    return handleResponse<{ data: WeeklyProgressResult }>(res);
  },

  /**
   * POST /api/v1/reviews/sessions/[id]/check-in
   * Verifies student attendance using dynamic HOD QR token
   */
  checkInWithQR: async (sessionId: string, qrToken: string): Promise<{ data: CheckInResult }> => {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/v1/reviews/sessions/${encodeURIComponent(sessionId)}/check-in`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ qr_token: qrToken }),
    });
    return handleResponse<{ data: CheckInResult }>(res);
  },

  /**
   * Prototype fallback helper to get local mock review sessions when backend returns 404
   */
  getFallbackReviewSessions: (activityId?: string): ReviewSession[] => {
    if (!activityId) return [...mockReviewSessions];
    return mockReviewSessions.filter((r) => r.activityId === activityId);
  },

  /**
   * Prototype fallback helper to get single mock review session by ID
   */
  getFallbackById: (id: string): ReviewSession | undefined => {
    return mockReviewSessions.find((r) => r.id === id);
  },
};
