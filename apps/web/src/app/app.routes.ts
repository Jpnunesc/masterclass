import { Routes } from '@angular/router';
import { impersonateLearnerGuard } from '@feature/auth';

export const APP_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./shell/home.component').then((m) => m.HomeComponent)
  },
  {
    path: 'auth',
    loadChildren: () => import('@feature/auth').then((m) => m.AUTH_ROUTES)
  },
  {
    path: 'onboarding',
    loadChildren: () =>
      import('@feature/onboarding').then((m) => m.ONBOARDING_ROUTES)
  },
  {
    path: 'assessment',
    loadChildren: () =>
      import('@feature/assessment').then((m) => m.ASSESSMENT_ROUTES)
  },
  {
    path: 'classroom',
    canActivate: [impersonateLearnerGuard],
    loadChildren: () =>
      import('@feature/classroom').then((m) => m.CLASSROOM_ROUTES)
  },
  {
    path: 'lesson',
    canActivate: [impersonateLearnerGuard],
    loadChildren: () => import('@feature/lesson').then((m) => m.LESSON_ROUTES)
  },
  {
    path: 'materials',
    canActivate: [impersonateLearnerGuard],
    loadChildren: () =>
      import('@feature/materials').then((m) => m.MATERIALS_ROUTES)
  },
  {
    path: 'review',
    canActivate: [impersonateLearnerGuard],
    loadChildren: () => import('@feature/review').then((m) => m.REVIEW_ROUTES)
  },
  {
    path: 'progress',
    canActivate: [impersonateLearnerGuard],
    loadChildren: () =>
      import('@feature/progress').then((m) => m.PROGRESS_ROUTES)
  },
  {
    path: 'history',
    canActivate: [impersonateLearnerGuard],
    loadChildren: () =>
      import('@feature/lesson-history').then((m) => m.LESSON_HISTORY_ROUTES)
  },
  {
    path: 'profile',
    canActivate: [impersonateLearnerGuard],
    loadChildren: () =>
      import('@feature/profile').then((m) => m.PROFILE_ROUTES)
  },
  {
    path: 'sandbox',
    loadChildren: () =>
      import('@feature/sandbox').then((m) => m.SANDBOX_ROUTES)
  },
  { path: '**', redirectTo: '' }
];
