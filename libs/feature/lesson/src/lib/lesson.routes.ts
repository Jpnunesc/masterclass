import { Routes } from '@angular/router';

import { provideLessonStubs } from './clients/stub-clients';

export const LESSON_ROUTES: Routes = [
  {
    path: '',
    providers: [provideLessonStubs()],
    loadComponent: () =>
      import('./lesson.component').then((m) => m.LessonPreviewComponent)
  }
];
