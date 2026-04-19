import { Routes } from '@angular/router';

export const CLASSROOM_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./classroom.component').then((m) => m.ClassroomComponent)
  }
];
