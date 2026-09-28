import { NextResponse } from 'next/server';

export interface ApiErrorDetail {
  field?: string;
  [key: string]: unknown;
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail;
  };
}

export function apiError(
  code: string,
  message: string,
  status: number = 400,
  details?: ApiErrorDetail
) {
  const payload: ApiErrorPayload = {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  return NextResponse.json(payload, { status });
}

export function apiSuccess<T>(data: T, status: number = 200, meta?: Record<string, unknown>) {
  return NextResponse.json(
    {
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  );
}
