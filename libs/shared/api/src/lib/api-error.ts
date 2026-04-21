import { HttpErrorResponse } from '@angular/common/http';

export type ApiErrorKind =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'bad_request'
  | 'vendor'
  | 'server'
  | 'unknown';

export interface ApiErrorShape {
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly message: string;
  readonly code?: string;
}

export class ApiError extends Error implements ApiErrorShape {
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly code?: string;

  constructor(shape: ApiErrorShape) {
    super(shape.message);
    this.name = 'ApiError';
    this.kind = shape.kind;
    this.status = shape.status;
    this.code = shape.code;
  }

  static fromHttp(err: HttpErrorResponse): ApiError {
    const status = err.status ?? 0;
    const body = (err.error && typeof err.error === 'object' ? err.error : null) as
      | { error?: string; message?: string; code?: string }
      | null;
    const message = body?.message ?? body?.error ?? err.message ?? 'Request failed';
    const code = body?.code;
    return new ApiError({ kind: kindFor(status), status, message, code });
  }
}

function kindFor(status: number): ApiErrorKind {
  if (status === 0) return 'network';
  if (status === 400) return 'bad_request';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 502) return 'vendor';
  if (status >= 500) return 'server';
  return 'unknown';
}
