import { Routes } from '@angular/router';

export const MATERIALS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./materials.component').then((m) => m.MaterialsComponent)
  }
];
