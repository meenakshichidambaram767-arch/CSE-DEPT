/**
 * Activities (Projects, Hackathons, Internships) API Client
 * SIET CSE Department Platform - API Contract v2.0
 */

import { apiClient, ApiError } from './client';
import {
  ActivityDecisionPayload,
  ApiActivity,
  CreateActivityPayload,
  PaginatedResponse,
  ResubmitActivityPayload,
} from '@/types/contract';
import { Activity } from '@/types';
import { mapActivityToApiPayload, mapApiActivityToActivity } from './mappers';
import {
  fixtureApiActivities,
} from '@/data/fixtures/activitiesFixtures';
import { mockActivities } from '@/data/mock';

export { ApiError };

export interface ActivitiesQueryParams {
  type?: string;
  status?: string;
  year?: string;
  section?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export const activitiesApi = {
  /**
   * GET /api/v1/activities (Mapped to UI model)
   */
  async getActivities(params?: ActivitiesQueryParams): Promise<PaginatedResponse<Activity>> {
    const res = await this.getRawActivities(params);
    return {
      data: res.data.map(mapApiActivityToActivity),
      meta: res.meta,
    };
  },

  /**
   * GET /api/v1/activities (Raw Contract format)
   */
  async getRawActivities(params?: ActivitiesQueryParams): Promise<PaginatedResponse<ApiActivity>> {
    return apiClient.get<PaginatedResponse<ApiActivity>>('/api/v1/activities', {
      params: params ? { ...params } : undefined,
      fallback: () => {
        let filtered = [...fixtureApiActivities];
        if (params?.type && params.type !== 'ALL') {
          filtered = filtered.filter((a) => a.type === params.type);
        }
        if (params?.status && params.status !== 'ALL') {
          filtered = filtered.filter((a) => a.status === params.status);
        }
        return {
          data: filtered,
          meta: { page: params?.page || 1, page_size: params?.page_size || 20, total: filtered.length },
        };
      },
    });
  },

  /**
   * GET /api/v1/activities/{id}
   */
  async getActivityById(id: string): Promise<{ data: Activity }> {
    const res = await apiClient.get<{ data: ApiActivity }>(`/api/v1/activities/${encodeURIComponent(id)}`, {
      fallback: () => {
        const found = fixtureApiActivities.find((a) => a.id === id || a.code === id);
        return { data: found || fixtureApiActivities[0] };
      },
    });
    return { data: mapApiActivityToActivity(res.data) };
  },

  /**
   * POST /api/v1/activities
   */
  async createActivity(
    payload: CreateActivityPayload | Partial<Activity>
  ): Promise<{ data: Activity }> {
    const body: CreateActivityPayload = 'start_date' in payload
      ? (payload as CreateActivityPayload)
      : mapActivityToApiPayload(payload as Partial<Activity>);

    const res = await apiClient.post<{ data: ApiActivity }>('/api/v1/activities', body, {
      fallback: () => ({
        data: {
          id: `local-act-${Date.now()}`,
          code: `ACT-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
          student_id: 'usr-student-001',
          student_name: 'Meena C',
          student_reg_no: '714023104088',
          department: 'CSE',
          year: 'III',
          type: body.type,
          title: body.title,
          description: body.description,
          technologies: body.technologies || [],
          start_date: body.start_date,
          end_date: body.end_date,
          organization: body.organization,
          company_name: body.company_name,
          company_role: body.company_role,
          company_location: body.company_location,
          stipend: body.stipend,
          github_url: body.github_url,
          demo_url: body.demo_url,
          guide_name: body.guide_name,
          guide_email: body.guide_email,
          team_members: body.team_members || [],
          document_ids: body.document_ids || [],
          status: 'SUBMITTED',
          created_at: new Date().toISOString(),
        },
      }),
    });

    return { data: mapApiActivityToActivity(res.data) };
  },

  /**
   * POST /api/v1/activities/{id}/decision
   */
  async executeDecision(
    id: string,
    payload: ActivityDecisionPayload
  ): Promise<{ data: Activity }> {
    const res = await apiClient.post<{ data: ApiActivity }>(
      `/api/v1/activities/${encodeURIComponent(id)}/decision`,
      payload,
      {
        fallback: () => {
          const existing = fixtureApiActivities.find((a) => a.id === id) || fixtureApiActivities[0];
          return {
            data: {
              ...existing,
              status: payload.decision,
              rejection_reason: payload.rejection_reason || undefined,
              revision_notes: payload.revision_notes || undefined,
            },
          };
        },
      }
    );

    return { data: mapApiActivityToActivity(res.data) };
  },

  /**
   * PUT /api/v1/activities/{id}/resubmit
   */
  async resubmitActivity(
    id: string,
    payload: ResubmitActivityPayload | Partial<Activity>
  ): Promise<{ data: Activity }> {
    const body: ResubmitActivityPayload = 'start_date' in payload
      ? (payload as ResubmitActivityPayload)
      : mapActivityToApiPayload(payload as Partial<Activity>);

    const res = await apiClient.put<{ data: ApiActivity }>(
      `/api/v1/activities/${encodeURIComponent(id)}/resubmit`,
      body,
      {
        fallback: () => {
          const existing = fixtureApiActivities.find((a) => a.id === id) || fixtureApiActivities[0];
          return {
            data: {
              ...existing,
              status: 'SUBMITTED',
              revision_notes: undefined,
            },
          };
        },
      }
    );

    return { data: mapApiActivityToActivity(res.data) };
  },

  /**
   * Fallback mock helpers for testing & offline mode
   */
  getFallbackActivities(type?: string): Activity[] {
    if (type) {
      return mockActivities.filter((a) => a.type === type);
    }
    return [...mockActivities];
  },

  getFallbackById(id: string): Activity | undefined {
    return mockActivities.find((a) => a.id === id);
  },

  mapToUI: mapApiActivityToActivity,
  mapToApi: mapActivityToApiPayload,
};

export default activitiesApi;
