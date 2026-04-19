import { Routes } from '@angular/router';

import { provideLessonHistory } from './providers';

export const LESSON_HISTORY_ROUTES: Routes = [
  {
    path: '',
    providers: [provideLessonHistory()],
    loadComponent: () =>
      import('./lesson-history.component').then((m) => m.LessonHistoryComponent)
  }
];
