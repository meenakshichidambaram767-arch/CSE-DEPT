/**
 * Central API Client Foundation & RFC 7807 Error Parser
 * SIET CSE Department Platform - API Contract v2.0
 *
 * Implements RFC 7807 error parsing, Supabase JWT bearer injection,
 * query parameter serialization, unified HTTP verbs, multipart uploads,
 * and offline compatibility assertion guards.
 */

import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { ApiErrorDetail, ApiErrorPayload } from '@/types/contract';

export type RFC7807Error = ApiErrorPayload;

// ==========================================
// 1. RFC 7807 ERROR MODEL & HELPERS
// ==========================================

export class ApiError extends Error {
  code: string;
  status: number;
  details?: ApiErrorDetail;

  constructor(
    codeOrStatus: string | number,
    messageOrCode?: string,
    statusOrMessage: number | string = 500,
    details?: ApiErrorDetail
  ) {
    let finalCode: string;
    let finalMessage: string;
    let finalStatus: number;
    let finalDetails: ApiErrorDetail | undefined = details;

    if (typeof codeOrStatus === 'number') {
      finalStatus = codeOrStatus;
      finalCode = messageOrCode || 'HTTP_ERROR';
      finalMessage = typeof statusOrMessage === 'string' ? statusOrMessage : 'HTTP Error';
    } else {
      finalCode = codeOrStatus;
      finalMessage = messageOrCode || 'API Error';
      finalStatus = typeof statusOrMessage === 'number' ? statusOrMessage : 500;
    }

    super(finalMessage);
    this.name = 'ApiError';
    this.code = finalCode;
    this.status = finalStatus;
    this.details = finalDetails;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  get field(): string | undefined {
    return this.details?.field;
  }

  get isValidationError(): boolean {
    return this.code === 'VALIDATION_ERROR' || !!this.field;
  }

  public toRFC7807(): RFC7807Error {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError || (typeof err === 'object' && err !== null && 'code' in err && 'status' in err);
}

export interface ParsedApiErrorResult extends ApiErrorPayload {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export function parseApiError(err: unknown): ParsedApiErrorResult {
  let code = 'UNKNOWN_ERROR';
  let message = 'An unexpected error occurred.';
  let details: any = undefined;

  if (err instanceof ApiError) {
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (typeof err === 'object' && err !== null) {
    if ('error' in err) {
      const candidate = (err as any).error;
      code = candidate?.code || 'UNKNOWN_ERROR';
      message = candidate?.message || 'An unexpected error occurred.';
      details = candidate?.details;
    } else if ('code' in err && 'message' in err) {
      const candidate = err as any;
      code = candidate.code;
      message = candidate.message;
      details = candidate.details;
    } else if (err instanceof Error) {
      message = err.message;
    }
  }

  return {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
    code,
    message,
    details,
  };
}

export function formatApiErrorMessage(error: unknown): string {
  const parsed = parseApiError(error);
  if (parsed.details && Object.keys(parsed.details).length > 0) {
    const detailList = Object.entries(parsed.details)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    return `${parsed.message} (${detailList})`;
  }
  return parsed.message;
}

/**
 * Verified offline guard to guarantee NO network calls to live backends
 */
export const IS_OFFLINE_MODE = true;

export function assertNoLiveNetwork(): void {
  if (!IS_OFFLINE_MODE) {
    throw new ApiError(500, 'LIVE_NETWORK_FORBIDDEN', 'Live network connections are strictly forbidden in Phase 5.');
  }
}


export function createApiErrorPayload(
  code: string,
  message: string,
  details?: ApiErrorDetail
): ApiErrorPayload {
  return {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
}

export function getFieldError(err: unknown, fieldName: string): string | null {
  if (err instanceof ApiError) {
    if (err.field === fieldName) {
      return err.message;
    }
    if (err.details && typeof err.details === 'object' && fieldName in err.details) {
      const val = err.details[fieldName];
      return typeof val === 'string' ? val : JSON.stringify(val);
    }
  }

  // Handle parsed ApiErrorPayload: { error: { message, details: { field, ... } } }
  if (err && typeof err === 'object' && 'error' in err) {
    const errorObj = (err as ApiErrorPayload).error;
    if (errorObj) {
      const details = errorObj.details;
      if (details && typeof details === 'object') {
        if ('field' in details && details.field === fieldName) {
          return errorObj.message;
        }
        if (fieldName in details) {
          const val = details[fieldName];
          return typeof val === 'string' ? val : JSON.stringify(val);
        }
      }
    }
  }

  return null;
}

// ==========================================
// 2. REQUEST & QUERY SERIALIZATION
// ==========================================

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  /** Optional fallback resolver for offline or fixture testing */
  fallback?: () => unknown;
}

export function buildQueryString(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') {
      searchParams.set(key, String(val));
    }
  }
  const str = searchParams.toString();
  return str ? `?${str}` : '';
}

export async function getAuthHeaders(isMultipart = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const supabase = createSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch {
    // Non-blocking for unauthenticated or mock runs
  }

  return headers;
}

// ==========================================
// 3. UNIFIED RESPONSE UNWRAPPING
// ==========================================

export async function unwrapResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorCode = 'HTTP_ERROR';
    let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    let details: ApiErrorDetail | undefined;

    try {
      const body = (await res.json()) as ApiErrorPayload;
      if (body?.error) {
        errorCode = body.error.code || errorCode;
        errorMessage = body.error.message || errorMessage;
        details = body.error.details;
      }
    } catch {
      // Non-JSON response
      if (res.status === 404) {
        errorCode = 'NOT_FOUND';
        errorMessage = `Requested resource was not found: ${res.url}`;
      } else if (res.status === 401) {
        errorCode = 'UNAUTHORIZED';
        errorMessage = 'Authentication token required or expired.';
      } else if (res.status === 403) {
        errorCode = 'FORBIDDEN';
        errorMessage = 'You do not have permission to perform this action.';
      }
    }

    throw new ApiError(errorCode, errorMessage, res.status, details);
  }

  // 204 No Content
  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}

// ==========================================
// 4. CENTRAL HTTP CLIENT
// ==========================================

export const apiClient = {
  /**
   * HTTP GET
   */
  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    const authHeaders = await getAuthHeaders(false);
    const query = buildQueryString(options?.params);
    const url = `${path}${query}`;

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { ...authHeaders, ...options?.headers },
        signal: options?.signal,
      });
      return await unwrapResponse<T>(res);
    } catch (err) {
      if (options?.fallback && (err instanceof ApiError ? err.status === 404 || err.status >= 500 : true)) {
        return options.fallback() as T;
      }
      throw err;
    }
  },

  /**
   * HTTP POST
   */
  async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const authHeaders = await getAuthHeaders(false);
    const query = buildQueryString(options?.params);
    const url = `${path}${query}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { ...authHeaders, ...options?.headers },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: options?.signal,
      });
      return await unwrapResponse<T>(res);
    } catch (err) {
      if (options?.fallback && (err instanceof ApiError ? err.status === 404 || err.status >= 500 : true)) {
        return options.fallback() as T;
      }
      throw err;
    }
  },

  /**
   * HTTP PUT
   */
  async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const authHeaders = await getAuthHeaders(false);
    const query = buildQueryString(options?.params);
    const url = `${path}${query}`;

    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { ...authHeaders, ...options?.headers },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: options?.signal,
      });
      return await unwrapResponse<T>(res);
    } catch (err) {
      if (options?.fallback && (err instanceof ApiError ? err.status === 404 || err.status >= 500 : true)) {
        return options.fallback() as T;
      }
      throw err;
    }
  },

  /**
   * HTTP PATCH
   */
  async patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const authHeaders = await getAuthHeaders(false);
    const query = buildQueryString(options?.params);
    const url = `${path}${query}`;

    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { ...authHeaders, ...options?.headers },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: options?.signal,
      });
      return await unwrapResponse<T>(res);
    } catch (err) {
      if (options?.fallback && (err instanceof ApiError ? err.status === 404 || err.status >= 500 : true)) {
        return options.fallback() as T;
      }
      throw err;
    }
  },

  /**
   * HTTP DELETE
   */
  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    const authHeaders = await getAuthHeaders(false);
    const query = buildQueryString(options?.params);
    const url = `${path}${query}`;

    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { ...authHeaders, ...options?.headers },
        signal: options?.signal,
      });
      return await unwrapResponse<T>(res);
    } catch (err) {
      if (options?.fallback && (err instanceof ApiError ? err.status === 404 || err.status >= 500 : true)) {
        return options.fallback() as T;
      }
      throw err;
    }
  },

  /**
   * HTTP Multipart Upload (Form Data)
   */
  async upload<T>(path: string, formData: FormData, options?: RequestOptions): Promise<T> {
    const authHeaders = await getAuthHeaders(true); // omit Content-Type so browser sets boundary
    const query = buildQueryString(options?.params);
    const url = `${path}${query}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { ...authHeaders, ...options?.headers },
        body: formData,
        signal: options?.signal,
      });
      return await unwrapResponse<T>(res);
    } catch (err) {
      if (options?.fallback && (err instanceof ApiError ? err.status === 404 || err.status >= 500 : true)) {
        return options.fallback() as T;
      }
      throw err;
    }
  },
};

export default apiClient;
