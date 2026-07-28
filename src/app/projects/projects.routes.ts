import { Routes } from '@angular/router';

export const PROJECTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/projects-list/projects-list.component').then(
        (module) => module.ProjectsListComponent,
      ),
  },
  {
    path: ':slug',
    loadComponent: () =>
      import('./pages/project-detail/project-detail.component').then(
        (module) => module.ProjectDetailComponent,
      ),
  },
];
