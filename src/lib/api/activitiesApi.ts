import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { ApiError } from './odApi';
import { Activity, ActivityType, ApiErrorEnvelope, PaginatedResponse } from '@/types';
import { mockActivities } from '@/data/mock';

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
    // Suppress token errors if unauthenticated
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

export interface ActivitiesQueryParams {
  type?: string;
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface CreateActivityPayload {
  type: ActivityType;
  title: string;
  description: string;
  technologies?: string[];
  start_date: string;
  end_date?: string;
  organization?: string;
  company_name?: string;
  github_url?: string;
  demo_url?: string;
  guide_name?: string;
  team_members?: Array<{
    name: string;
    register_number?: string;
    regNo?: string;
    email?: string;
    role?: string;
  }>;
}

export const activitiesApi = {
  /**
   * GET /api/v1/activities
   * Fetches paginated list of student activities (Projects, Hackathons, Internships)
   */
  getActivities: async (params?: ActivitiesQueryParams): Promise<PaginatedResponse<Activity>> => {
    const headers = await getAuthHeaders();
    const searchParams = new URLSearchParams();
    if (params?.type && params.type !== 'ALL') searchParams.set('type', params.type);
    if (params?.status && params.status !== 'ALL') searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.page_size) searchParams.set('page_size', String(params.page_size));

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await fetch(`/api/v1/activities${query}`, { headers });
    return handleResponse<PaginatedResponse<Activity>>(res);
  },

  /**
   * GET /api/v1/activities/[id]
   * Fetches single activity details including team members, documents, and status history
   */
  getActivityById: async (id: string): Promise<{ data: Activity }> => {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/v1/activities/${encodeURIComponent(id)}`, { headers });
    return handleResponse<{ data: Activity }>(res);
  },

  /**
   * POST /api/v1/activities
   * Creates a new activity proposal (Student Only). Status set to SUBMITTED by server.
   */
  createActivity: async (payload: CreateActivityPayload): Promise<{ data: Activity }> => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/v1/activities', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    return handleResponse<{ data: Activity }>(res);
  },

  /**
   * Prototype fallback helper to get local mock activities when backend returns 404
   */
  getFallbackActivities: (type?: ActivityType): Activity[] => {
    if (!type || (type as ActivityType | 'ALL') === 'ALL') return [...mockActivities];
    return mockActivities.filter((a) => a.type === type);
  },

  /**
   * Prototype fallback helper to get single activity by ID
   */
  getFallbackById: (id: string): Activity | undefined => {
    return mockActivities.find((a) => a.id === id);
  },
};
