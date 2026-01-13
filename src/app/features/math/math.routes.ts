import { Routes } from '@angular/router';

export const mathRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./set-selection/set-selection.component').then(m => m.SetSelectionComponent)
  },
  {
    path: 'exercise/:setId',
    loadComponent: () =>
      import('./exercise/exercise.component').then(m => m.ExerciseComponent)
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./set-creator/set-creator.component').then(m => m.SetCreatorComponent)
  },
  {
    path: 'edit/:setId',
    loadComponent: () =>
      import('./set-creator/set-creator.component').then(m => m.SetCreatorComponent)
  },
  {
    path: 'summary',
    loadComponent: () =>
      import('./summary/summary.component').then(m => m.SummaryComponent)
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./settings/settings.component').then(m => m.SettingsComponent)
  }
];

