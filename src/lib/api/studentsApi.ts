/**
 * Student Directory API Client
 * SIET CSE Department Platform - API Contract v2.0
 */

import { apiClient, ApiError } from './client';
import { PaginatedResponse, StudentProfile, User } from '@/types';
import { mockUsers } from '@/data/mock';

export { ApiError };

export const studentsApi = {
  /**
   * Synchronous helper for student selection lists in prototype UI
   */
  getRealStudents(): User[] {
    return mockUsers.filter((u) => u.role === 'STUDENT');
  },

  /**
   * GET /api/v1/students
   * Lists enrolled students with year/section filtering
   */
  async getStudents(params?: {
    year?: string;
    section?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<StudentProfile>> {
    return apiClient.get<PaginatedResponse<StudentProfile>>('/api/v1/students', {
      params: params ? { ...params } : undefined,
      fallback: () => {
        const studentUsers = mockUsers.filter((u) => u.role === 'STUDENT');
        const profiles: StudentProfile[] = studentUsers.map((u) => ({
          id: u.id,
          userId: u.id,
          registerNumber: u.registerNumber || '',
          name: u.name,
          department: u.department,
          year: (u.year as 'I' | 'II' | 'III' | 'IV') || 'III',
          section: (u.section as 'A' | 'B' | 'C' | 'D' | 'E') || 'A',
          email: u.email,
        }));
        return {
          data: profiles,
          meta: { page: params?.page || 1, page_size: params?.page_size || 20, total: profiles.length },
        };
      },
    });
  },

  /**
   * GET /api/v1/students/{id}
   * Fetches full profile for a student
   */
  async getStudentById(id: string): Promise<{ data: StudentProfile }> {
    return apiClient.get<{ data: StudentProfile }>(
      `/api/v1/students/${encodeURIComponent(id)}`,
      {
        fallback: () => {
          const u = mockUsers.find((user) => user.id === id || user.registerNumber === id) || mockUsers[0];
          return {
            data: {
              id: u.id,
              userId: u.id,
              registerNumber: u.registerNumber || '714023104088',
              name: u.name,
              department: u.department,
              year: (u.year as 'I' | 'II' | 'III' | 'IV') || 'III',
              section: (u.section as 'A' | 'B' | 'C' | 'D' | 'E') || 'A',
              email: u.email,
            },
          };
        },
      }
    );
  },
};

export default studentsApi;
