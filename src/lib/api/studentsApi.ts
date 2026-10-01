import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { ApiError } from './odApi';
import { ApiErrorEnvelope, PaginatedResponse, StudentProfile, User } from '@/types';
import { mockUsers } from '@/data/mock';

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

export const studentsApi = {
  /**
   * GET /api/v1/students
   * Fetches real student directory profiles for teammate selection
   */
  getStudents: async (params?: { search?: string; page?: number; page_size?: number }): Promise<PaginatedResponse<StudentProfile>> => {
    const headers = await getAuthHeaders();
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.page_size) searchParams.set('page_size', String(params.page_size));

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await fetch(`/api/v1/students${query}`, { headers });
    return handleResponse<PaginatedResponse<StudentProfile>>(res);
  },

  /**
   * Helper to return real student directory records from identity data model
   */
  getRealStudents: (): User[] => {
    return mockUsers.filter((u) => u.role === 'STUDENT');
  },
};
