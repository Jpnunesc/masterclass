import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { API_CONFIG, ApiError, authInterceptor } from '@shared/api';

import { LessonTurnApi } from './lesson-turn.api';

const TEST_API = 'http://test.api';

describe('LessonTurnApi', () => {
  let api: LessonTurnApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: TEST_API } }
      ]
    });
    api = TestBed.inject(LessonTurnApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('turn() posts request shape and returns the typed result', async () => {
    const promise = new Promise<{ teacher: string; corrections: number }>((resolve, reject) => {
      api
        .turn({
          studentLevel: 'B1',
          topic: 'travel',
          studentUtterance: 'I goed to the park yesterday.',
          history: [
            { role: 'system', content: 'You are a teacher.' },
            { role: 'user', content: 'I goed to the park yesterday.' }
          ],
          targetLanguage: 'English'
        })
        .subscribe({
          next: (r) => resolve({ teacher: r.teacherResponse, corrections: r.corrections.length }),
          error: reject
        });
    });

    const req = http.expectOne(`${TEST_API}/api/lesson/turn`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(
      jasmine.objectContaining({
        studentLevel: 'B1',
        topic: 'travel',
        studentUtterance: 'I goed to the park yesterday.',
        targetLanguage: 'English'
      })
    );
    expect(req.request.body.history.length).toBe(2);
    req.flush({
      teacherResponse: 'Try "I went" instead.',
      corrections: [
        {
          original: 'I goed',
          suggestion: 'I went',
          explanation: 'Past simple of "go" is irregular.'
        }
      ]
    });

    const result = await promise;
    expect(result.teacher).toBe('Try "I went" instead.');
    expect(result.corrections).toBe(1);
  });

  it('turnForLocale() picks the targetLanguage string for pt-BR', async () => {
    const promise = new Promise<void>((resolve, reject) => {
      api
        .turnForLocale(
          { studentLevel: 'A2', topic: 'food', studentUtterance: 'eu gosta de pizza' },
          'pt-BR'
        )
        .subscribe({ next: () => resolve(), error: reject });
    });
    const req = http.expectOne(`${TEST_API}/api/lesson/turn`);
    expect(req.request.body.targetLanguage).toBe('Portuguese (Brazil)');
    req.flush({ teacherResponse: 'OK', corrections: [] });
    await promise;
  });

  it('falls back to English targetLanguage for the en locale', async () => {
    const promise = new Promise<void>((resolve, reject) => {
      api
        .turnForLocale(
          { studentLevel: 'B1', topic: 'work', studentUtterance: 'I have meeting today.' },
          'en'
        )
        .subscribe({ next: () => resolve(), error: reject });
    });
    const req = http.expectOne(`${TEST_API}/api/lesson/turn`);
    expect(req.request.body.targetLanguage).toBe('English');
    req.flush({ teacherResponse: 'OK', corrections: [] });
    await promise;
  });

  it('400 vendor failure surfaces ApiError.bad_request with backend message', async () => {
    const promise = new Promise<unknown>((resolve, reject) => {
      api
        .turn({ studentLevel: '', topic: 't', studentUtterance: 'x' })
        .subscribe({
          next: () => reject(new Error('expected error')),
          error: resolve
        });
    });
    http
      .expectOne(`${TEST_API}/api/lesson/turn`)
      .flush({ error: 'studentLevel is required.' }, { status: 400, statusText: 'Bad Request' });
    const err = (await promise) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.kind).toBe('bad_request');
    expect(err.message).toBe('studentLevel is required.');
  });

  it('502 vendor failure surfaces ApiError.vendor', async () => {
    const promise = new Promise<unknown>((resolve, reject) => {
      api
        .turn({ studentLevel: 'B1', topic: 't', studentUtterance: 'x' })
        .subscribe({
          next: () => reject(new Error('expected error')),
          error: resolve
        });
    });
    http
      .expectOne(`${TEST_API}/api/lesson/turn`)
      .flush({ error: 'azure timeout' }, { status: 502, statusText: 'Bad Gateway' });
    const err = (await promise) as ApiError;
    expect(err.kind).toBe('vendor');
  });
});
