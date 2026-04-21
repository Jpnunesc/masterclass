import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { ApiClient, TokenStorageService } from '@shared/api';

export interface RegisterRequest {
  readonly email: string;
  readonly password: string;
  readonly displayName: string;
}

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

export interface AuthResponse {
  readonly studentId: string;
  readonly email: string;
  readonly displayName: string;
  readonly accessToken: string;
  readonly expiresAt: string;
}

export interface StudentProfile {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly proficiencyLevel: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClient);
  private readonly tokens = inject(TokenStorageService);

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('/auth/register', request)
      .pipe(tap((res) => this.tokens.setAccessToken(res.accessToken)));
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('/auth/login', request)
      .pipe(tap((res) => this.tokens.setAccessToken(res.accessToken)));
  }

  me(): Observable<StudentProfile> {
    return this.api.get<StudentProfile>('/auth/me');
  }

  signOut(): void {
    this.tokens.clear();
  }
}
