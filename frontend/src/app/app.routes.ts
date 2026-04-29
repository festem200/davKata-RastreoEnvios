import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then((module) => module.LoginComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard-page').then((module) => module.DashboardPage)
  },
  {
    path: 'routes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/routes/pages/routes-page/routes-page.component').then(
        (module) => module.RoutesPageComponent
      )
  },
  {
    path: 'tracking',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tracking/pages/tracking-page').then((module) => module.TrackingPage)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
