import { Routes } from '@angular/router';

export const CLASSROOM_ROUTES: Routes = [
  {
    path: 'states-gallery',
    loadComponent: () =>
      import('./states-gallery.component').then(
        (m) => m.ClassroomStatesGalleryComponent
      )
  },
  {
    path: ':sessionId',
    loadComponent: () =>
      import('./classroom.component').then((m) => m.ClassroomComponent)
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'demo'
  }
];
