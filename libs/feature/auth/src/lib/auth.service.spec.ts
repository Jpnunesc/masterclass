import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { API_CONFIG, ApiError, TokenStorageService, authInterceptor } from '@shared/api';

import { AuthService } from './auth.service';

const TEST_API = 'http://test.api';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let tokens: TokenStorageService;

  beforeEach(() => {
    sessionStorage.removeItem('mc.auth.access');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: TEST_API } }
      ]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenStorageService);
  });

  afterEach(() => http.verify());

  it('login stores the access token on success', async () => {
    const promise = new Promise<void>((resolve, reject) => {
      service.login({ email: 'a@b.co', password: 'hunter22' }).subscribe({
        next: (res) => {
          expect(res.accessToken).toBe('jwt.123');
          expect(tokens.accessToken()).toBe('jwt.123');
          expect(sessionStorage.getItem('mc.auth.access')).toBe('jwt.123');
          resolve();
        },
        error: reject
      });
    });

    const req = http.expectOne(`${TEST_API}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'a@b.co', password: 'hunter22' });
    req.flush({
      studentId: 'abc',
      email: 'a@b.co',
      displayName: 'Alex',
      accessToken: 'jwt.123',
      expiresAt: new Date().toISOString()
    });

    await promise;
  });

  it('login 401 surfaces ApiError.unauthorized and clears token', async () => {
    tokens.setAccessToken('stale');

    const promise = new Promise<void>((resolve, reject) => {
      service.login({ email: 'x@y.z', password: 'wrong' }).subscribe({
        next: () => reject(new Error('expected error')),
        error: (err) => {
          try {
            expect(err).toBeInstanceOf(ApiError);
            expect((err as ApiError).kind).toBe('unauthorized');
            expect(tokens.accessToken()).toBeNull();
            resolve();
          } catch (e) {
            reject(e);
          }
        }
      });
    });

    http.expectOne(`${TEST_API}/auth/login`).flush(null, { status: 401, statusText: 'Unauthorized' });

    await promise;
  });

  it('register 400 surfaces ApiError.bad_request with server message', async () => {
    const promise = new Promise<void>((resolve, reject) => {
      service.register({ email: 'dup@x.co', password: 'hunter22', displayName: 'Dup' }).subscribe({
        next: () => reject(new Error('expected error')),
        error: (err) => {
          try {
            expect(err).toBeInstanceOf(ApiError);
            expect((err as ApiError).kind).toBe('bad_request');
            expect((err as ApiError).message).toBe('Email already registered.');
            expect(tokens.accessToken()).toBeNull();
            resolve();
          } catch (e) {
            reject(e);
          }
        }
      });
    });

    http.expectOne(`${TEST_API}/auth/register`).flush(
      { error: 'Email already registered.' },
      { status: 400, statusText: 'Bad Request' }
    );

    await promise;
  });

  it('me attaches Authorization header from stored token', async () => {
    tokens.setAccessToken('live.token');

    const promise = new Promise<void>((resolve, reject) => {
      service.me().subscribe({
        next: (profile) => {
          expect(profile.email).toBe('a@b.co');
          resolve();
        },
        error: reject
      });
    });

    const req = http.expectOne(`${TEST_API}/auth/me`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer live.token');
    req.flush({ id: 'abc', email: 'a@b.co', displayName: 'Alex', proficiencyLevel: 'A1' });

    await promise;
  });

  it('signOut clears stored token', () => {
    tokens.setAccessToken('live.token');
    service.signOut();
    expect(tokens.accessToken()).toBeNull();
    expect(sessionStorage.getItem('mc.auth.access')).toBeNull();
  });
});
