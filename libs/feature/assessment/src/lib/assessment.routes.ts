import { Routes } from '@angular/router';

import { provideAssessmentStubs } from './clients/stub-clients';

export const ASSESSMENT_ROUTES: Routes = [
  {
    path: '',
    providers: [provideAssessmentStubs()],
    loadComponent: () =>
      import('./assessment.component').then((m) => m.AssessmentComponent)
  }
];
