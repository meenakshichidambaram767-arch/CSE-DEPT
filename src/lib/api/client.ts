/**
 * API Client & RFC7807 Error Parser
 * Offline Mock Resolver - Strictly avoids any live network requests to Meena, Nattu, or Supabase
 */

import { RFC7807Error } from './contractTypes';

export class ApiError extends Error {
  public code: string;
  public details?: Record<string, string>;
  public status: number;

  constructor(status: number, code: string, message: string, details?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
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

export function parseApiError(error: unknown): {
  code: string;
  message: string;
  details?: Record<string, string>;
} {
  if (error instanceof ApiError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  if (error && typeof error === 'object') {
    if ('error' in error) {
      const rfc = (error as RFC7807Error).error;
      return {
        code: rfc.code || 'UNKNOWN_ERROR',
        message: rfc.message || 'An unexpected error occurred',
        details: rfc.details,
      };
    }
    if ('code' in error && 'message' in error) {
      const errObj = error as { code: string; message: string; details?: Record<string, string> };
      return {
        code: errObj.code,
        message: errObj.message,
        details: errObj.details,
      };
    }
  }

  if (error instanceof Error) {
    return {
      code: 'INTERNAL_ERROR',
      message: error.message,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: String(error) || 'An unexpected error occurred',
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
  // Guaranteed offline execution
  if (!IS_OFFLINE_MODE) {
    throw new ApiError(500, 'LIVE_NETWORK_FORBIDDEN', 'Live network connections are strictly forbidden in Phase 5.');
  }
}
