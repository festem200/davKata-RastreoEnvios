import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/tracking/pages/tracking-page').then((module) => module.TrackingPage)
  }
];
