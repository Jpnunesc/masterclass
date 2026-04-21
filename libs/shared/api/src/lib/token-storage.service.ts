import { Injectable, signal } from '@angular/core';

const ACCESS_TOKEN_KEY = 'mc.auth.access';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly storage = this.safeStorage();
  private readonly token = signal<string | null>(this.readInitial());

  readonly accessToken = this.token.asReadonly();

  setAccessToken(token: string | null): void {
    this.token.set(token);
    try {
      if (token) this.storage?.setItem(ACCESS_TOKEN_KEY, token);
      else this.storage?.removeItem(ACCESS_TOKEN_KEY);
    } catch {
      /* storage may be blocked; in-memory token still works */
    }
  }

  clear(): void {
    this.setAccessToken(null);
  }

  private readInitial(): string | null {
    try {
      return this.storage?.getItem(ACCESS_TOKEN_KEY) ?? null;
    } catch {
      return null;
    }
  }

  private safeStorage(): Storage | null {
    try {
      return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
    } catch {
      return null;
    }
  }
}
