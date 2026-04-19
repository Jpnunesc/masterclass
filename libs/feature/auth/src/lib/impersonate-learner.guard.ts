import { Injectable, inject, signal } from '@angular/core';
import {
  CanActivateFn,
  Router,
  UrlTree,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot
} from '@angular/router';

export interface LearnerIdentity {
  readonly userId: string;
  readonly displayName: string | null;
  readonly impersonated: boolean;
}

/**
 * Session scaffold. v1.0 ships a permissive default; the auth backend arrives in
 * SEV-24 and replaces `setIdentity()` with a real bootstrap (cookie/JWT → user).
 */
@Injectable({ providedIn: 'root' })
export class LearnerSessionService {
  private readonly currentIdentity = signal<LearnerIdentity | null>({
    userId: 'dev-learner',
    displayName: null,
    impersonated: true
  });

  readonly identity = this.currentIdentity.asReadonly();

  setIdentity(identity: LearnerIdentity | null): void {
    this.currentIdentity.set(identity);
  }

  isAuthenticated(): boolean {
    return this.currentIdentity() !== null;
  }
}

/**
 * Route guard that protects authenticated learner routes. Today it accepts the
 * impersonated dev identity; SEV-24 will swap in real auth without route churn.
 */
export const impersonateLearnerGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const session = inject(LearnerSessionService);
  const router = inject(Router);
  if (session.isAuthenticated()) return true;
  return router.createUrlTree(['/auth'], {
    queryParams: { returnTo: state.url }
  });
};
