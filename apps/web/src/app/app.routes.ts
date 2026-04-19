import { Routes } from '@angular/router';

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
    loadChildren: () =>
      import('@feature/classroom').then((m) => m.CLASSROOM_ROUTES)
  },
  {
    path: 'materials',
    loadChildren: () =>
      import('@feature/materials').then((m) => m.MATERIALS_ROUTES)
  },
  {
    path: 'review',
    loadChildren: () => import('@feature/review').then((m) => m.REVIEW_ROUTES)
  },
  {
    path: 'progress',
    loadChildren: () =>
      import('@feature/progress').then((m) => m.PROGRESS_ROUTES)
  },
  {
    path: 'history',
    loadChildren: () =>
      import('@feature/lesson-history').then((m) => m.LESSON_HISTORY_ROUTES)
  },
  {
    path: 'profile',
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
