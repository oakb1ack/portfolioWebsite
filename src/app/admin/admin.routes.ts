import { Routes } from '@angular/router';

import { adminAuthGuard } from './core/admin-auth.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    title: 'Admin sign in',
    loadComponent: () =>
      import('./pages/login/admin-login.component').then((module) => module.AdminLoginComponent),
  },
  {
    path: '',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./layout/admin-shell.component').then((module) => module.AdminShellComponent),
    children: [
      {
        path: '',
        title: 'Admin dashboard',
        loadComponent: () =>
          import('./pages/dashboard/admin-dashboard.component').then(
            (module) => module.AdminDashboardComponent,
          ),
      },
      {
        path: 'projects',
        title: 'Manage projects',
        loadComponent: () =>
          import('./pages/projects/admin-projects.component').then(
            (module) => module.AdminProjectsComponent,
          ),
      },
      {
        path: 'posts',
        title: 'Manage posts',
        loadComponent: () =>
          import('./pages/posts/admin-posts.component').then(
            (module) => module.AdminPostsComponent,
          ),
      },
      {
        path: 'profile',
        title: 'Manage profile',
        loadComponent: () =>
          import('./pages/profile/admin-profile.component').then(
            (module) => module.AdminProfileComponent,
          ),
      },
      {
        path: 'contact-links',
        title: 'Manage contact links',
        loadComponent: () =>
          import('./pages/contact-links/admin-contact-links.component').then(
            (module) => module.AdminContactLinksComponent,
          ),
      },
      {
        path: 'taxonomy',
        title: 'Manage taxonomy',
        loadComponent: () =>
          import('./pages/taxonomy/admin-taxonomy.component').then(
            (module) => module.AdminTaxonomyComponent,
          ),
      },
      {
        path: 'media',
        title: 'Manage media',
        loadComponent: () =>
          import('./pages/media/admin-media.component').then(
            (module) => module.AdminMediaComponent,
          ),
      },
    ],
  },
];
