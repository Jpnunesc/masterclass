import { Routes } from '@angular/router';

import { provideProgress } from './providers';

export const PROGRESS_ROUTES: Routes = [
  {
    path: '',
    providers: [provideProgress()],
    loadComponent: () =>
      import('./progress.component').then((m) => m.ProgressComponent)
  }
];
