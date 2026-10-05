/**
 * Departmental Records & Student Directory API Client
 * SIET CSE Department Platform - API Contract v2.0
 *
 * Implements instant directory filtering across all 4 academic years (15 sections),
 * slide-over inspection queries, and RFC 4180 CSV export streaming.
 */

import { apiClient, ApiError, buildQueryString } from './client';
import {
  ApiStudentRecord,
  ApiStudentSummary,
  PaginatedResponse,
} from '@/types/contract';
import {
  fixtureApiStudents,
  fixtureStudentSummary,
} from '@/data/fixtures/recordsFixtures';

export { ApiError };

export interface RecordsQueryParams {
  year?: string;
  section?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface RecordsExportParams {
  year?: string;
  section?: string;
  type?: 'OD' | 'ACTIVITIES' | 'ALL';
}

export const recordsApi = {
  /**
   * GET /api/v1/records/students
   * Paginated student directory with instant year/section/search filtering
   */
  async getStudents(
    params?: RecordsQueryParams
  ): Promise<PaginatedResponse<ApiStudentRecord>> {
    return apiClient.get<PaginatedResponse<ApiStudentRecord>>('/api/v1/records/students', {
      params: params ? { ...params } : undefined,
      fallback: () => {
        let filtered = [...fixtureApiStudents];
        if (params?.year && params.year !== 'ALL') {
          filtered = filtered.filter((s) => s.year === params.year);
        }
        if (params?.section && params.section !== 'ALL') {
          filtered = filtered.filter((s) => s.section === params.section);
        }
        if (params?.search && params.search.trim()) {
          const q = params.search.toLowerCase();
          filtered = filtered.filter(
            (s) => s.name.toLowerCase().includes(q) || s.registerNumber.includes(q)
          );
        }
        return {
          data: filtered,
          meta: { page: params?.page || 1, page_size: params?.page_size || 20, total: filtered.length },
        };
      },
    });
  },

  /**
   * GET /api/v1/records/students/{id}/summary
   * Populates the HOD slide-over inspection drawer: full OD clearances, activities, and review history
   */
  async getStudentSummary(id: string): Promise<{ data: ApiStudentSummary }> {
    return apiClient.get<{ data: ApiStudentSummary }>(
      `/api/v1/records/students/${encodeURIComponent(id)}/summary`,
      {
        fallback: () => ({ data: fixtureStudentSummary }),
      }
    );
  },

  /**
   * Returns a ready-to-use URL for the RFC 4180 CSV export endpoint
   */
  getExportUrl(params?: RecordsExportParams): string {
    const query = buildQueryString(params as Record<string, string>);
    return `/api/v1/records/export${query}`;
  },

  /**
   * GET /api/v1/records/export
   * Direct fetcher for RFC 4180 CSV export content
   */
  async downloadExport(params?: RecordsExportParams): Promise<string> {
    const query = buildQueryString(params as Record<string, string>);
    const res = await fetch(`/api/v1/records/export${query}`);
    if (!res.ok) {
      throw new ApiError('EXPORT_FAILED', `Failed to export CSV: ${res.statusText}`, res.status);
    }
    return res.text();
  },
};

export default recordsApi;
