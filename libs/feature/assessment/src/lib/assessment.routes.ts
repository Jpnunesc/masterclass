import { Routes } from '@angular/router';

import { provideAssessmentHttpClients } from './clients/http-clients';

export const ASSESSMENT_ROUTES: Routes = [
  {
    path: '',
    providers: [provideAssessmentHttpClients()],
    loadComponent: () =>
      import('./assessment.component').then((m) => m.AssessmentComponent)
  }
];
