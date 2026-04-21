import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { API_CONFIG, ApiError, authInterceptor } from '@shared/api';

import { LessonsApi } from './lessons.api';

const TEST_API = 'http://test.api';

describe('LessonsApi', () => {
  let api: LessonsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: TEST_API } }
      ]
    });
    api = TestBed.inject(LessonsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list() hits GET /api/lessons with no query when params omitted', async () => {
    const promise = new Promise<number>((resolve, reject) => {
      api.list().subscribe({ next: (r) => resolve(r.total), error: reject });
    });
    const req = http.expectOne((r) => r.url === `${TEST_API}/api/lessons`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush({
      items: [
        { id: '1', slug: 'hello', title: 'Hello', summary: 'Intro', targetLevel: 'A1', orderIndex: 0 }
      ],
      total: 1,
      take: 20,
      skip: 0
    });
    expect(await promise).toBe(1);
  });

  it('list({take, skip}) forwards paging params', async () => {
    const promise = new Promise<void>((resolve, reject) => {
      api.list({ take: 10, skip: 5 }).subscribe({ next: () => resolve(), error: reject });
    });
    const req = http.expectOne((r) => r.url === `${TEST_API}/api/lessons`);
    expect(req.request.params.get('take')).toBe('10');
    expect(req.request.params.get('skip')).toBe('5');
    req.flush({ items: [], total: 0, take: 10, skip: 5 });
    await promise;
  });

  it('401 surfaces ApiError.unauthorized', async () => {
    const promise = new Promise<unknown>((resolve, reject) => {
      api.list().subscribe({
        next: () => reject(new Error('expected error')),
        error: resolve
      });
    });
    http
      .expectOne((r) => r.url === `${TEST_API}/api/lessons`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    const err = (await promise) as ApiError;
    expect(err.kind).toBe('unauthorized');
  });
});
