import { Routes } from '@angular/router';

import { provideReview } from './providers';

export const REVIEW_ROUTES: Routes = [
  {
    path: '',
    providers: [provideReview()],
    loadComponent: () =>
      import('./review.component').then((m) => m.ReviewComponent)
  }
];
