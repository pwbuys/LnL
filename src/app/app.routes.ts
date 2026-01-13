import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'math',
    loadChildren: () => import('./features/math/math.routes').then(m => m.mathRoutes)
  },
  {
    path: '',
    redirectTo: '/math',
    pathMatch: 'full'
  }
];
