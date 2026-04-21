import { HttpErrorResponse } from '@angular/common/http';

import { ApiError } from './api-error';

describe('ApiError.fromHttp', () => {
  it('maps 401 to unauthorized', () => {
    const err = ApiError.fromHttp(
      new HttpErrorResponse({ status: 401, error: { message: 'no token' } })
    );
    expect(err.kind).toBe('unauthorized');
    expect(err.status).toBe(401);
    expect(err.message).toBe('no token');
  });

  it('maps 400 to bad_request with body code', () => {
    const err = ApiError.fromHttp(
      new HttpErrorResponse({ status: 400, error: { message: 'invalid email', code: 'auth.email' } })
    );
    expect(err.kind).toBe('bad_request');
    expect(err.code).toBe('auth.email');
  });

  it('maps 502 to vendor', () => {
    const err = ApiError.fromHttp(
      new HttpErrorResponse({ status: 502, error: { error: 'groq offline' } })
    );
    expect(err.kind).toBe('vendor');
    expect(err.message).toBe('groq offline');
  });

  it('maps status 0 to network', () => {
    const err = ApiError.fromHttp(new HttpErrorResponse({ status: 0 }));
    expect(err.kind).toBe('network');
  });

  it('maps 500 to server', () => {
    const err = ApiError.fromHttp(new HttpErrorResponse({ status: 500 }));
    expect(err.kind).toBe('server');
  });
});
