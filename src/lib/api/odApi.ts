/**
 * On-Duty (OD) Management API Client
 * SIET CSE Department Platform - API Contract v2.0
 *
 * Implements 5-step form lifecycle, conflict detection, revision loop, and bulk decisions.
 */

import { apiClient, ApiError } from './client';
import {
  ApiODRequest,
  BulkODDecisionPayload,
  CreateODPayload,
  ODConflictResponse,
  ODDecisionPayload,
  PaginatedResponse,
  ResubmitODPayload,
} from '@/types/contract';
import { ODApplication } from '@/types';
import { mapApiODToODApplication, mapODApplicationToApiPayload } from './mappers';
import {
  fixtureApiODs,
  fixtureODConflictResponse,
} from '@/data/fixtures/odFixtures';
import { mockODApplications } from '@/data/mock';

export { ApiError };

export interface ODQueryParams {
  page?: number;
  page_size?: number;
  status?: string;
  year?: string;
  section?: string;
  purpose?: string;
  search?: string;
}

export const odApi = {
  /**
   * GET /api/v1/od-requests (Mapped to UI model)
   */
  async getODRequests(params?: ODQueryParams): Promise<PaginatedResponse<ODApplication>> {
    const res = await this.getRawODRequests(params);
    return {
      data: res.data.map(mapApiODToODApplication),
      meta: res.meta,
    };
  },

  /**
   * GET /api/v1/od-requests (Raw Contract format)
   */
  async getRawODRequests(params?: ODQueryParams): Promise<PaginatedResponse<ApiODRequest>> {
    return apiClient.get<PaginatedResponse<ApiODRequest>>('/api/v1/od-requests', {
      params: params ? { ...params } : undefined,
      fallback: () => {
        let filtered = [...fixtureApiODs];
        if (params?.status && params.status !== 'ALL') {
          filtered = filtered.filter((o) => o.status === params.status);
        }
        if (params?.purpose && params.purpose !== 'ALL') {
          filtered = filtered.filter((o) => o.purpose === params.purpose);
        }
        return {
          data: filtered,
          meta: {
            page: params?.page || 1,
            page_size: params?.page_size || 20,
            total: filtered.length,
          },
        };
      },
    });
  },

  /**
   * GET /api/v1/od-requests/{id}
   */
  async getODRequestById(id: string): Promise<{ data: ODApplication }> {
    const res = await apiClient.get<{ data: ApiODRequest }>(`/api/v1/od-requests/${encodeURIComponent(id)}`, {
      fallback: () => {
        const found = fixtureApiODs.find((o) => o.id === id || o.code === id);
        return { data: found || fixtureApiODs[0] };
      },
    });
    return { data: mapApiODToODApplication(res.data) };
  },

  /**
   * POST /api/v1/od-requests
   */
  async createODRequest(
    payload: CreateODPayload | Partial<ODApplication>
  ): Promise<{ data: ODApplication }> {
    const body: CreateODPayload = 'start_date' in payload
      ? (payload as CreateODPayload)
      : mapODApplicationToApiPayload(payload as Partial<ODApplication>);

    const res = await apiClient.post<{ data: ApiODRequest }>('/api/v1/od-requests', body, {
      fallback: () => ({
        data: {
          ...fixtureApiODs[0],
          id: `local-od-${Date.now()}`,
          code: `OD-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
          event_name: body.event_name,
          purpose: body.purpose,
          start_date: body.start_date,
          end_date: body.end_date,
          from_time: body.from_time,
          to_time: body.to_time,
          status: 'PENDING',
        },
      }),
    });

    return { data: mapApiODToODApplication(res.data) };
  },

  /**
   * PUT /api/v1/od-requests/{id}/resubmit
   */
  async resubmitODRequest(
    id: string,
    payload: ResubmitODPayload | Partial<ODApplication>
  ): Promise<{ data: ODApplication }> {
    const body: ResubmitODPayload = 'start_date' in payload
      ? (payload as ResubmitODPayload)
      : mapODApplicationToApiPayload(payload as Partial<ODApplication>);

    const res = await apiClient.put<{ data: ApiODRequest }>(
      `/api/v1/od-requests/${encodeURIComponent(id)}/resubmit`,
      body,
      {
        fallback: () => {
          const existing = fixtureApiODs.find((o) => o.id === id) || fixtureApiODs[0];
          return {
            data: {
              ...existing,
              status: 'PENDING',
              revision_notes: undefined,
            },
          };
        },
      }
    );

    return { data: mapApiODToODApplication(res.data) };
  },

  /**
   * POST /api/v1/od-requests/{id}/decision
   */
  async executeDecision(
    id: string,
    payload: ODDecisionPayload
  ): Promise<{ data: ODApplication }> {
    const res = await apiClient.post<{ data: ApiODRequest }>(
      `/api/v1/od-requests/${encodeURIComponent(id)}/decision`,
      payload,
      {
        fallback: () => {
          const existing = fixtureApiODs.find((o) => o.id === id) || fixtureApiODs[0];
          return {
            data: {
              ...existing,
              status: payload.decision,
              remarks: payload.remarks || undefined,
              rejection_reason: payload.rejection_reason || undefined,
              revision_notes: payload.revision_notes || undefined,
            },
          };
        },
      }
    );

    return { data: mapApiODToODApplication(res.data) };
  },

  /**
   * GET /api/v1/od-requests/{id}/conflicts
   */
  async getODConflicts(id: string): Promise<{ data: ODConflictResponse }> {
    return apiClient.get<{ data: ODConflictResponse }>(
      `/api/v1/od-requests/${encodeURIComponent(id)}/conflicts`,
      {
        fallback: () => ({ data: fixtureODConflictResponse }),
      }
    );
  },

  /**
   * POST /api/v1/od-requests/bulk-decision
   */
  async executeBulkDecision(
    payload: BulkODDecisionPayload
  ): Promise<{ data: { updated_count: number } }> {
    return apiClient.post<{ data: { updated_count: number } }>(
      '/api/v1/od-requests/bulk-decision',
      payload,
      {
        fallback: () => ({ data: { updated_count: payload.od_ids.length } }),
      }
    );
  },

  /**
   * Fallback mock helpers for testing & offline mode
   */
  getFallbackODs(): ODApplication[] {
    return [...mockODApplications];
  },

  getFallbackById(id: string): ODApplication | undefined {
    return mockODApplications.find((o) => o.id === id);
  },

  mapToUI: mapApiODToODApplication,
  mapToApi: mapODApplicationToApiPayload,
};

export default odApi;
