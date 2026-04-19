import { Routes } from '@angular/router';

import { provideMaterials } from './providers';

export const MATERIALS_ROUTES: Routes = [
  {
    path: '',
    providers: [provideMaterials()],
    loadComponent: () =>
      import('./library.component').then((m) => m.LibraryComponent)
  },
  {
    path: 'lesson/:lessonId',
    loadComponent: () =>
      import('./lesson-review.component').then((m) => m.LessonReviewComponent)
  }
];
