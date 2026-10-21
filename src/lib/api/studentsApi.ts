/**
 * Student Directory API Client
 * SIET CSE Department Platform - API Contract v2.0
 */

import { apiClient, ApiError } from './client';
import { PaginatedResponse, StudentProfile } from '@/types';

export { ApiError };

const DEFAULT_FALLBACK_STUDENTS: StudentProfile[] = [
  {
    id: 'std-student-001',
    userId: 'usr-student-001',
    registerNumber: '714023104088',
    name: 'Meena C',
    department: 'CSE',
    year: 'III',
    section: 'B',
    email: 'meena.23cse@siet.ac.in',
  },
  {
    id: 'std-student-002',
    userId: 'usr-student-002',
    registerNumber: '714023104042',
    name: 'Dharun S',
    department: 'CSE',
    year: 'III',
    section: 'A',
    email: 'dharun.23cse@siet.ac.in',
  },
  {
    id: 'std-student-003',
    userId: 'usr-student-003',
    registerNumber: '714023104099',
    name: 'Nithish K',
    department: 'CSE',
    year: 'III',
    section: 'B',
    email: 'nithish.23cse@siet.ac.in',
  },
];

export const studentsApi = {
  /**
   * Helper for student directory list via GET /api/v1/students
   */
  async getRealStudents(): Promise<StudentProfile[]> {
    const res = await this.getStudents({ page_size: 100 });
    return res.data || [];
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
      fallback: () => ({
        data: DEFAULT_FALLBACK_STUDENTS,
        meta: {
          page: params?.page || 1,
          page_size: params?.page_size || 20,
          total: DEFAULT_FALLBACK_STUDENTS.length,
        },
      }),
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
          const found =
            DEFAULT_FALLBACK_STUDENTS.find(
              (user) => user.id === id || user.registerNumber === id
            ) || DEFAULT_FALLBACK_STUDENTS[0];
          return { data: found };
        },
      }
    );
  },
};

export default studentsApi;
