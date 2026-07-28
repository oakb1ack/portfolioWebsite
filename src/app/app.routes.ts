import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home/home.component').then((module) => module.HomeComponent),
  },
  {
    path: 'projects',
    loadChildren: () =>
      import('./projects/projects.routes').then((module) => module.PROJECTS_ROUTES),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./contact/contact.component').then((module) => module.ContactComponent),
  },
  {
    path: 'resume',
    loadComponent: () =>
      import('./resume/resume.component').then((module) => module.ResumeComponent),
  },
  { path: '**', redirectTo: '' },
];
