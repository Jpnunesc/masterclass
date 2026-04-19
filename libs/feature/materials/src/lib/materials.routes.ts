import { Routes } from '@angular/router';

import { provideMaterials } from './providers';

export const MATERIALS_ROUTES: Routes = [
  {
    path: '',
    providers: [provideMaterials()],
    loadComponent: () =>
      import('./materials.component').then((m) => m.MaterialsComponent)
  }
];
