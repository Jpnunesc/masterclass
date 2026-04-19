import { Routes } from '@angular/router';

export const SANDBOX_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'tokens'
  },
  {
    path: 'tokens',
    loadComponent: () =>
      import('./tokens-reference.component').then((m) => m.TokensReferenceComponent)
  }
];
