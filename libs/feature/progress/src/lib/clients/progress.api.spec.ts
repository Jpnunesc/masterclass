import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { API_CONFIG, ApiError, authInterceptor } from '@shared/api';

import { ProgressApi } from './progress.api';

const TEST_API = 'http://test.api';

describe('ProgressApi', () => {
  let api: ProgressApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: TEST_API } }
      ]
    });
    api = TestBed.inject(ProgressApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('me() hits GET /api/progress/me and returns the typed snapshot', async () => {
    const promise = new Promise<string>((resolve, reject) => {
      api.me().subscribe({ next: (snap) => resolve(snap.level), error: reject });
    });

    const req = http.expectOne(`${TEST_API}/api/progress/me`);
    expect(req.request.method).toBe('GET');
    req.flush({
      studentId: 'student-1',
      level: 'B2',
      lessonsCompleted: 12,
      vocabularyKnown: 320,
      accuracyPercent: 84.5,
      capturedAt: '2026-04-21T10:00:00Z'
    });

    expect(await promise).toBe('B2');
  });

  it('404 surfaces as ApiError.not_found so callers can treat "no snapshot" separately', async () => {
    const promise = new Promise<unknown>((resolve, reject) => {
      api.me().subscribe({
        next: () => reject(new Error('expected error')),
        error: resolve
      });
    });
    http
      .expectOne(`${TEST_API}/api/progress/me`)
      .flush(null, { status: 404, statusText: 'Not Found' });
    const err = (await promise) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.kind).toBe('not_found');
  });

  it('401 clears the stored token via the auth interceptor', async () => {
    const promise = new Promise<unknown>((resolve, reject) => {
      api.me().subscribe({
        next: () => reject(new Error('expected error')),
        error: resolve
      });
    });
    http
      .expectOne(`${TEST_API}/api/progress/me`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    const err = (await promise) as ApiError;
    expect(err.kind).toBe('unauthorized');
  });
});
