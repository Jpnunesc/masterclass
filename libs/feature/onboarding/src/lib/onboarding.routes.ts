import { Routes } from '@angular/router';

export const ONBOARDING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./onboarding-shell.component').then((m) => m.OnboardingShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'language' },
      {
        path: 'language',
        loadComponent: () =>
          import('./step-language.component').then((m) => m.StepLanguageComponent)
      },
      {
        path: 'teacher',
        loadComponent: () =>
          import('./step-teacher.component').then((m) => m.StepTeacherComponent)
      },
      {
        path: 'assessment',
        loadComponent: () =>
          import('./step-assessment.component').then((m) => m.StepAssessmentComponent)
      }
    ]
  }
];
