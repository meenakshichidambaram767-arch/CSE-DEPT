import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { ApiError } from './odApi';
import { ApiErrorEnvelope, Activity, ODApplication, ReviewSession } from '@/types';
import { mockActivities, mockODApplications, mockReviewSessions } from '@/data/mock';

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
    // Suppress token lookup error
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

export interface StudentReportSummary {
  student: {
    id: string;
    name: string;
    email: string;
    registerNumber: string;
    department: string;
    year: string;
    section?: string;
  };
  metrics: {
    totalActivities: number;
    completedProjects: number;
    approvedInternships: number;
    hackathonEntries: number;
    totalODRequests: number;
    approvedODDays: number;
    reviewsAttended: number;
  };
  activities: Activity[];
  odRequests: ODApplication[];
  reviews: ReviewSession[];
}

export const reportsApi = {
  /**
   * GET Student Isolated Report Summary
   * Fetches the authenticated student's profile via /api/v1/me and aggregates their activities, ODs, and review sessions.
   */
  getStudentReportSummary: async (): Promise<{ data: StudentReportSummary }> => {
    const headers = await getAuthHeaders();

    // 1. Fetch authenticated user profile
    const meRes = await fetch('/api/v1/me', { headers });
    const meData = await handleResponse<{
      data: {
        id: string;
        name: string;
        email: string;
        profile?: {
          register_number?: string;
          department?: string;
          year?: string;
          section?: string;
        };
      };
    }>(meRes);

    const user = meData.data;
    const student = {
      id: user.id,
      name: user.name || 'Authenticated Student',
      email: user.email || 'student@siet.ac.in',
      registerNumber: user.profile?.register_number || '714023104088',
      department: user.profile?.department || 'CSE',
      year: user.profile?.year || 'II',
      section: user.profile?.section || 'A',
    };

    // 2. Fetch authenticated student's activities
    let activities: Activity[] = [];
    try {
      const actRes = await fetch('/api/v1/activities', { headers });
      const actData = await handleResponse<{ data: Activity[] }>(actRes);
      activities = actData.data || [];
    } catch {
      // Fallback if activities route returns error
    }

    // 3. Fetch authenticated student's OD requests
    let odRequests: ODApplication[] = [];
    try {
      const odRes = await fetch('/api/v1/od-requests', { headers });
      const odData = await handleResponse<{ data: ODApplication[] }>(odRes);
      odRequests = odData.data || [];
    } catch {
      // Fallback if od-requests route returns error
    }

    // 4. Fetch authenticated student's review sessions
    let reviews: ReviewSession[] = [];
    try {
      const revRes = await fetch('/api/v1/reviews/sessions', { headers });
      const revData = await handleResponse<{ data: ReviewSession[] }>(revRes);
      reviews = revData.data || [];
    } catch {
      // Fallback if review-sessions route returns error
    }

    const approvedODs = odRequests.filter((o) => o.status === 'APPROVED');
    const approvedODDays = approvedODs.reduce((sum, o) => sum + (o.totalDays || 1), 0);

    return {
      data: {
        student,
        metrics: {
          totalActivities: activities.length,
          completedProjects: activities.filter((a) => a.type === 'PROJECT' && (a.status === 'APPROVED' || a.status === 'ACTIVE')).length,
          approvedInternships: activities.filter((a) => a.type === 'INTERNSHIP' && (a.status === 'APPROVED' || a.status === 'ACTIVE')).length,
          hackathonEntries: activities.filter((a) => a.type === 'HACKATHON').length,
          totalODRequests: odRequests.length,
          approvedODDays,
          reviewsAttended: reviews.filter((r) => r.status === 'COMPLETED').length,
        },
        activities,
        odRequests,
        reviews,
      },
    };
  },

  /**
   * Prototype Fallback Helper for Student Report when server returns 404
   */
  getFallbackStudentReport: (): StudentReportSummary => {
    return {
      student: {
        id: 'usr-student-001',
        name: 'Meena C',
        email: 'meena.23cse@siet.ac.in',
        registerNumber: '714023104088',
        department: 'CSE',
        year: 'II',
        section: 'A',
      },
      metrics: {
        totalActivities: mockActivities.length,
        completedProjects: mockActivities.filter((a) => a.type === 'PROJECT').length,
        approvedInternships: mockActivities.filter((a) => a.type === 'INTERNSHIP').length,
        hackathonEntries: mockActivities.filter((a) => a.type === 'HACKATHON').length,
        totalODRequests: mockODApplications.length,
        approvedODDays: mockODApplications
          .filter((o) => o.status === 'APPROVED')
          .reduce((sum, o) => sum + (o.totalDays || 1), 0),
        reviewsAttended: mockReviewSessions.filter((r) => r.status === 'COMPLETED').length,
      },
      activities: mockActivities,
      odRequests: mockODApplications,
      reviews: mockReviewSessions,
    };
  },
};
