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
    path: 'blog',
    loadChildren: () => import('./blog/blog.routes').then((module) => module.BLOG_ROUTES),
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
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.routes').then((module) => module.ADMIN_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
