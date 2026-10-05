/**
 * Weekly Review Engine API Client
 * SIET CSE Department Platform - API Contract v2.0
 *
 * Implements batch scheduling, 4-quadrant student progress, expiring QR check-in,
 * and session finalization. Enforces 100% non-evaluative review cycles (PRD §5.3).
 */

import { apiClient, ApiError } from './client';
import {
  ApiReviewSession,
  BatchScheduleReviewsPayload,
  FinalizeReviewPayload,
  GenerateQrResponse,
  PaginatedResponse,
  ReviewCheckInPayload,
  ReviewCheckInResponse,
  ReviewProgressPayload,
} from '@/types/contract';
import { ReviewSession, WeeklyProgress } from '@/types';
import { mapApiReviewToReviewSession, mapWeeklyProgressToApiPayload } from './mappers';
import {
  fixtureApiReviews,
  fixtureCheckInResponse,
  fixtureGenerateQrResponse,
  fixturePaginatedReviews,
} from '@/data/fixtures/reviewsFixtures';
import { mockReviewSessions } from '@/data/mock';

export { ApiError };

export interface ReviewSessionsQueryParams {
  activity_id?: string;
  status?: string;
  type?: string;
  page?: number;
  page_size?: number;
}

export interface ReviewCheckInResult extends ReviewCheckInResponse {
  message?: string;
}

export const reviewsApi = {
  /**
   * POST /api/v1/reviews/schedule
   */
  async scheduleReviews(
    payload: BatchScheduleReviewsPayload
  ): Promise<{ data: ReviewSession[] }> {
    const res = await apiClient.post<{ data: ApiReviewSession[] }>(
      '/api/v1/reviews/schedule',
      payload,
      {
        fallback: () => ({ data: fixtureApiReviews }),
      }
    );
    return { data: res.data.map(mapApiReviewToReviewSession) };
  },

  /**
   * GET /api/v1/reviews/sessions (Mapped to UI model)
   */
  async getSessions(
    params?: ReviewSessionsQueryParams
  ): Promise<PaginatedResponse<ReviewSession>> {
    const res = await this.getRawSessions(params);
    return {
      data: res.data.map(mapApiReviewToReviewSession),
      meta: res.meta,
    };
  },

  /**
   * GET /api/v1/reviews/sessions (Raw Contract format)
   */
  async getRawSessions(
    params?: ReviewSessionsQueryParams
  ): Promise<PaginatedResponse<ApiReviewSession>> {
    return apiClient.get<PaginatedResponse<ApiReviewSession>>('/api/v1/reviews/sessions', {
      params: params ? { ...params } : undefined,
      fallback: () => {
        let filtered = [...fixtureApiReviews];
        if (params?.activity_id) {
          filtered = filtered.filter((r) => r.activity_id === params.activity_id);
        }
        if (params?.status && params.status !== 'ALL') {
          filtered = filtered.filter((r) => r.status === params.status);
        }
        if (params?.type && params.type !== 'ALL') {
          filtered = filtered.filter((r) => r.review_type === params.type);
        }
        return {
          data: filtered,
          meta: { page: params?.page || 1, page_size: params?.page_size || 20, total: filtered.length },
        };
      },
    });
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
    return [...mockReviewSessions];
  },

  /**
   * GET /api/v1/reviews/sessions/{id}
   */
  async getSessionById(id: string): Promise<{ data: ReviewSession }> {
    const res = await apiClient.get<{ data: ApiReviewSession }>(
      `/api/v1/reviews/sessions/${encodeURIComponent(id)}`,
      {
        fallback: () => {
          const found = fixtureApiReviews.find((r) => r.id === id || r.code === id);
          return { data: found || fixtureApiReviews[0] };
        },
      }
    );
    return { data: mapApiReviewToReviewSession(res.data) };
  },

  /**
   * POST /api/v1/reviews/sessions/{id}/progress
   */
  async submitProgress(
    id: string,
    payload: ReviewProgressPayload | Partial<WeeklyProgress>
  ): Promise<{ data: { id: string; success: boolean } }> {
    const body: ReviewProgressPayload = 'completed_this_week' in payload
      ? (payload as ReviewProgressPayload)
      : mapWeeklyProgressToApiPayload(payload as Partial<WeeklyProgress>);

    return apiClient.post<{ data: { id: string; success: boolean } }>(
      `/api/v1/reviews/sessions/${encodeURIComponent(id)}/progress`,
      body,
      {
        fallback: () => ({ data: { id: `prog-${Date.now()}`, success: true } }),
      }
    );
  },

  /**
   * Compatibility alias for submitProgress
   */
  async submitWeeklyProgress(
    id: string,
    payload: ReviewProgressPayload | Partial<WeeklyProgress>
  ): Promise<{ data: { id: string; success: boolean } }> {
    return this.submitProgress(id, payload);
  },

  /**
   * POST /api/v1/reviews/sessions/{id}/generate-qr
   */
  async generateQr(id: string): Promise<{ data: GenerateQrResponse }> {
    return apiClient.post<{ data: GenerateQrResponse }>(
      `/api/v1/reviews/sessions/${encodeURIComponent(id)}/generate-qr`,
      {},
      {
        fallback: () => ({ data: { ...fixtureGenerateQrResponse, session_id: id } }),
      }
    );
  },

  /**
   * POST /api/v1/reviews/sessions/{id}/check-in
   */
  async checkIn(
    id: string,
    payload: ReviewCheckInPayload | string
  ): Promise<{ data: ReviewCheckInResult }> {
    const body: ReviewCheckInPayload = typeof payload === 'string' ? { token: payload } : payload;
    const res = await apiClient.post<{ data: ReviewCheckInResponse }>(
      `/api/v1/reviews/sessions/${encodeURIComponent(id)}/check-in`,
      body,
      {
        fallback: () => ({ data: fixtureCheckInResponse }),
      }
    );

    return {
      data: {
        ...res.data,
        message: 'Attendance check-in verified successfully.',
      },
    };
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
   * POST /api/v1/reviews/sessions/{id}/finalize
   */
  async finalizeSession(
    id: string,
    payload: FinalizeReviewPayload
  ): Promise<{ data: { success: boolean; session_id: string } }> {
    return apiClient.post<{ data: { success: boolean; session_id: string } }>(
      `/api/v1/reviews/sessions/${encodeURIComponent(id)}/finalize`,
      payload,
      {
        fallback: () => ({ data: { success: true, session_id: id } }),
      }
    );
  },
};

export default reviewsApi;
