import { Routes } from '@angular/router';

export const PROGRESS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./progress.component').then((m) => m.ProgressComponent)
  }
];
