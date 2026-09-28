import { createClient } from '@/lib/supabase/client';
import { ODApplication, PaginatedResponse, ApiErrorEnvelope, StudentProfile, UserRole } from '@/types';
import { mockODApplications } from '@/data/mock';

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, status: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface MeApiResponse {
  data: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    profile?: StudentProfile | Record<string, unknown>;
  };
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const supabase = createClient();
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
    let errorMessage = res.status === 404
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

export const odApi = {
  /**
   * GET /api/v1/me
   * Fetches authenticated user identity & student profile
   */
  getMe: async (): Promise<MeApiResponse> => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/v1/me', { headers });
    return handleResponse<MeApiResponse>(res);
  },

  /**
   * POST /api/v1/auth/sign-out
   * Sign out endpoint
   */
  signOut: async (): Promise<{ data: { success: boolean } }> => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/v1/auth/sign-out', { method: 'POST', headers });
    return handleResponse<{ data: { success: boolean } }>(res);
  },

  /**
   * GET /api/v1/od-requests
   * Fetches paginated list of OD requests for authenticated student
   */
  getODRequests: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
  }): Promise<PaginatedResponse<ODApplication>> => {
    const headers = await getAuthHeaders();
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.page_size) searchParams.set('page_size', String(params.page_size));
    if (params?.status) searchParams.set('status', params.status);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await fetch(`/api/v1/od-requests${query}`, { headers });
    return handleResponse<PaginatedResponse<ODApplication>>(res);
  },

  /**
   * GET /api/v1/od-requests/{id}
   * Fetches detailed information for a specific OD request
   */
  getODRequestById: async (id: string): Promise<{ data: ODApplication }> => {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/v1/od-requests/${encodeURIComponent(id)}`, { headers });
    return handleResponse<{ data: ODApplication }>(res);
  },

  /**
   * POST /api/v1/od-requests
   * Creates a new OD application. Server forces status = 'PENDING'.
   */
  createODRequest: async (
    payload: Partial<ODApplication>
  ): Promise<{ data: ODApplication }> => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/v1/od-requests', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    return handleResponse<{ data: ODApplication }>(res);
  },

  /**
   * PUT /api/v1/od-requests/{id}/resubmit
   * Resubmits an OD request when in REVISION_REQUESTED state.
   * State machine: REVISION_REQUESTED -> PENDING
   */
  resubmitODRequest: async (
    id: string,
    payload: Partial<ODApplication>
  ): Promise<{ data: ODApplication }> => {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/v1/od-requests/${encodeURIComponent(id)}/resubmit`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    return handleResponse<{ data: ODApplication }>(res);
  },

  /**
   * Prototype fallback helper to get local mock ODs when backend endpoint is unbuilt
   */
  getFallbackODs: (): ODApplication[] => {
    return [...mockODApplications];
  },

  getFallbackById: (id: string): ODApplication | undefined => {
    return mockODApplications.find((o) => o.id === id);
  },
};
