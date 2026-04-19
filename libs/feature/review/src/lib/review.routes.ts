import { Routes } from '@angular/router';

export const REVIEW_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./review.component').then((m) => m.ReviewComponent)
  }
];
