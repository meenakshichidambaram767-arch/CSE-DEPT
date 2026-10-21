/**
 * Departmental Events API Client
 * SIET CSE Department Platform - API Contract v2.0
 */

import { apiClient, ApiError } from './client';
import { ODEvent, PaginatedResponse } from '@/types';

export { ApiError };

export interface EventsQueryParams {
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface EventDetailResponse extends ODEvent {
  attachedODs?: Array<{
    id: string;
    code: string;
    studentName: string;
    studentRegNo: string;
    status: string;
  }>;
}

export const eventsApi = {
  /**
   * GET /api/v1/events
   * Lists departmental approved OD events
   */
  async getEvents(params?: EventsQueryParams): Promise<PaginatedResponse<ODEvent>> {
    return apiClient.get<PaginatedResponse<ODEvent>>('/api/v1/events', {
      params: params ? { ...params } : undefined,
    });
  },

  /**
   * GET /api/v1/events/{id}
   * Fetches event details with attached OD clearances
   */
  async getEventById(id: string): Promise<{ data: EventDetailResponse }> {
    return apiClient.get<{ data: EventDetailResponse }>(
      `/api/v1/events/${encodeURIComponent(id)}`
    );
  },

  /**
   * Fallback helper
   */
  getFallbackEvents(): ODEvent[] {
    return [];
  },
};

export default eventsApi;
